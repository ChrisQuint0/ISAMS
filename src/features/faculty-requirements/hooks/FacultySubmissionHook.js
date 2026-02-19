import { useState, useEffect } from 'react';
import { FacultySubmissionService } from '../services/FacultySubmissionService';

export function useFacultySubmission() {
    const [courses, setCourses] = useState([]);
    const [requiredDocs, setRequiredDocs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadCourses();
    }, []);

    const loadCourses = async () => {
        try {
            const data = await FacultySubmissionService.getFacultyCourses();
            setCourses(data || []);
        } catch (err) {
            console.error(err);
            setError('Failed to load courses');
        }
    };

    const loadRequiredDocs = async (courseId) => {
        if (!courseId) {
            setRequiredDocs([]);
            return;
        }
        setLoading(true);
        try {
            const data = await FacultySubmissionService.getRequiredDocs(courseId);
            setRequiredDocs(data || []);
        } catch (err) {
            console.error(err);
            setError('Failed to load document requirements');
        } finally {
            setLoading(false);
        }
    };

    const submitDocument = async ({ file, courseId, docTypeId }) => {
        setIsSubmitting(true);
        setError(null);
        try {
            const data = await FacultySubmissionService.uploadSubmission({
                file,
                courseId,
                docTypeId
            });
            return data;
        } catch (err) {
            console.error(err);
            setError(err.message || 'Submission failed');
            return false;
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
        courses,
        requiredDocs,
        loading,
        isSubmitting,
        error,
        loadRequiredDocs,
        submitDocument
    };
}
