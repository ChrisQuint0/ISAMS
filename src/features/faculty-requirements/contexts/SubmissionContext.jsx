import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { FacultySubmissionService } from '../services/FacultySubmissionService';
import { useToast } from "@/components/ui/toast/toaster";

const SubmissionContext = createContext(null);

export function SubmissionProvider({ children }) {
    const [activeSubmissions, setActiveSubmissions] = useState({});
    const { addToast } = useToast();
    
    // Use a ref to track submissions in progress to avoid stale state in async loops
    const processingRef = useRef({});

    const submitToQueue = useCallback(async ({ files, courseId, docTypeId, semester, academicYear, courseCode, docTypeName }) => {
        const submissionId = crypto.randomUUID();
        const startTime = Date.now();

        // Initialize queue item
        const newSubmission = {
            id: submissionId,
            courseCode,
            docTypeName,
            totalFiles: files.length,
            completedFiles: 0,
            status: 'processing',
            error: null,
            startTime
        };

        setActiveSubmissions(prev => ({ ...prev, [submissionId]: newSubmission }));
        processingRef.current[submissionId] = newSubmission;

        try {
            let hasLate = false;
            for (let i = 0; i < files.length; i++) {
                const fileObj = files[i];
                
                const data = await FacultySubmissionService.uploadSubmission({
                    file: fileObj.file,
                    courseId,
                    docTypeId,
                    semester,
                    academicYear
                });

                if (data?.is_late) {
                    hasLate = true;
                }

                // Update progress
                const updated = {
                    ...processingRef.current[submissionId],
                    completedFiles: i + 1
                };
                processingRef.current[submissionId] = updated;
                setActiveSubmissions(prev => ({ ...prev, [submissionId]: updated }));
            }

            // Mark as complete
            const final = {
                ...processingRef.current[submissionId],
                status: 'completed',
                isLate: hasLate
            };
            processingRef.current[submissionId] = final;
            setActiveSubmissions(prev => ({ ...prev, [submissionId]: final }));

            // Notify user globally
            addToast({
                title: "Submission Complete",
                description: `${docTypeName} for ${courseCode} has been uploaded successfully${hasLate ? ' (Marked as LATE)' : ''}.`,
                variant: "success"
            });

            // Cleanup after a delay so UI can show completion
            setTimeout(() => {
                setActiveSubmissions(prev => {
                    const next = { ...prev };
                    delete next[submissionId];
                    return next;
                });
                delete processingRef.current[submissionId];
            }, 5000);

            return { success: true, is_late: hasLate };

        } catch (err) {
            console.error('[SubmissionContext] Global upload failed:', err);
            
            const failed = {
                ...processingRef.current[submissionId],
                status: 'error',
                error: err.message || 'Upload failed'
            };
            processingRef.current[submissionId] = failed;
            setActiveSubmissions(prev => ({ ...prev, [submissionId]: failed }));

            addToast({
                title: "Submission Failed",
                description: `Failed to upload ${docTypeName} for ${courseCode}: ${err.message}`,
                variant: "destructive"
            });

            // Keep error in state longer for user to see
            setTimeout(() => {
                setActiveSubmissions(prev => {
                    const next = { ...prev };
                    delete next[submissionId];
                    return next;
                });
                delete processingRef.current[submissionId];
            }, 10000);

            return { success: false, error: err.message };
        }
    }, [addToast]);

    const value = {
        activeSubmissions,
        submitToQueue,
        isAnySubmitting: Object.values(activeSubmissions).some(s => s.status === 'processing')
    };

    return (
        <SubmissionContext.Provider value={value}>
            {children}
        </SubmissionContext.Provider>
    );
}

export const useSubmission = () => {
    const context = useContext(SubmissionContext);
    if (!context) {
        throw new Error('useSubmission must be used within a SubmissionProvider');
    }
    return context;
};
