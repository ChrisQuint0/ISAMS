import { useState, useEffect } from 'react';
import { FacultyResourceService } from '../services/FacultyResourceService';
import { supabase } from '@/lib/supabaseClient';

export function useFacultyResources() {
    const [templates, setTemplates] = useState([]);
    const [archives, setArchives] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [courseList, setCourseList] = useState([]); // List of courses with submissions
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [history, setHistory] = useState([]); // List of archived submissions for selected course
    const [submissionVersions, setSubmissionVersions] = useState([]); // History of a specific submission
    const [downloading, setDownloading] = useState(false);
    const [cloning, setCloning] = useState(false);
    const [faqs, setFaqs] = useState([]);
    const [categories, setCategories] = useState([]);
    // Dynamic Options
    const [options, setOptions] = useState({ semesters: [], academic_years: [] });

    useEffect(() => {
        loadTemplates();
        loadFAQs();
        loadCategories();
        loadOptions();
    }, []);

    const loadTemplates = async () => {
        try {
            setLoading(true);
            const data = await FacultyResourceService.getTemplates();
            setTemplates(data || []);
        } catch (err) {
            console.error(err);
            setError('Failed to load templates');
            setTimeout(() => setError(null), 3000);
        } finally {
            setLoading(false);
        }
    };

    const loadArchivedCourses = async (semester) => {
        try {
            setLoading(true);
            const data = await FacultyResourceService.getArchivedCourses(semester);
            setCourseList(data || []);
            setHistory([]);
            setSelectedCourse(null);
        } catch (err) {
            console.error(err);
            setError('Failed to load archived courses');
            setTimeout(() => setError(null), 3000);
        } finally {
            setLoading(false);
        }
    };

    const loadCourseHistory = async (courseId) => {
        try {
            setLoading(true);
            const data = await FacultyResourceService.getCourseVersions(courseId);
            setHistory(data || []);
            setSelectedCourse(courseId);
            setSubmissionVersions([]); // Clear previous versions
        } catch (err) {
            console.error(err);
            setError('Failed to load course submissions');
            setTimeout(() => setError(null), 3000);
        } finally {
            setLoading(false);
        }
    };

    const loadSubmissionVersions = async (submissionId) => {
        try {
            // Don't set global loading, maybe local loading state?
            // For now, we'll just set the state and handle UI loading there
            const data = await FacultyResourceService.getDocumentVersions(submissionId);
            setSubmissionVersions(data || []);
        } catch (err) {
            console.error(err);
            setError('Failed to load version history');
            setTimeout(() => setError(null), 3000);
        }
    };

    const loadFAQs = async () => {
        try {
            const data = await FacultyResourceService.getFAQs();
            setFaqs(data || []);
        } catch (err) {
            console.error(err);
            // Don't set global error for this secondary data
        }
    };

    const loadCategories = async () => {
        try {
            const data = await FacultyResourceService.getTemplateCategories();
            setCategories(data || []);
        } catch (err) {
            console.error(err);
        }
    };

    const handleDownloadAll = async (courseId, semester, academicYear) => {
        try {
            setDownloading(true);
            await FacultyResourceService.downloadAllDocuments(courseId, semester, academicYear);
        } catch (err) {
            console.error(err);
            setError('Failed to download documents');
            setTimeout(() => setError(null), 3000);
        } finally {
            setDownloading(false);
        }
    };

    const loadArchives = async (semester, academicYear) => {
        // Deprecating in favor of hierarchical view, but keeping for backward compat if needed
        try {
            setLoading(true);
            const data = await FacultyResourceService.getArchivedSubmissions(semester, academicYear);
            setArchives(data || []);
        } catch (err) {
            console.error(err);
            setError('Failed to load archives');
            setTimeout(() => setError(null), 3000);
        } finally {
            setLoading(false);
        }
    };

    const loadOptions = async () => {
        try {
            const { data: courses } = await supabase
                .from('courses_fs')
                .select('semester, academic_year');

            const sems = [...new Set(courses?.map(c => c.semester))].filter(Boolean).sort();
            const years = [...new Set(courses?.map(c => c.academic_year))].filter(Boolean).sort().reverse();

            setOptions({ semesters: sems, academic_years: years });
        } catch (err) {
            console.error('Failed to load options', err);
        }
    };

    const handleClone = async (selectedSubmissionIds, targetCourseId, targetSemester, targetAcademicYear) => {
        try {
            setCloning(true);
            let successCount = 0;
            let failCount = 0;

            for (const oldSubId of selectedSubmissionIds) {
                try {
                    await FacultyResourceService.cloneDocument(
                        oldSubId,
                        targetCourseId,
                        targetSemester,
                        targetAcademicYear
                    );
                    successCount++;
                } catch (err) {
                    console.error(`Failed to clone ${oldSubId}:`, err);
                    failCount++;
                }
            }

            if (failCount > 0) {
                setError(`Cloned ${successCount} documents. Failed to clone ${failCount} documents.`);
                setTimeout(() => setError(null), 5000);
            }

            return { successCount, failCount };
        } catch (err) {
            console.error('Error during bulk clone process:', err);
            setError('Failed to initiate cloning process');
            setTimeout(() => setError(null), 3000);
            return { successCount: 0, failCount: selectedSubmissionIds.length };
        } finally {
            setCloning(false);
        }
    };

    return {
        templates,
        archives,
        loading,
        error,
        loadTemplates,
        loadArchives,
        loadArchivedCourses,
        loadCourseHistory,
        loadSubmissionVersions,
        loadFAQs,
        loadCategories,
        handleDownloadAll,
        courseList,
        history,
        submissionVersions,
        selectedCourse,
        downloading,
        cloning,
        faqs,
        categories,
        options, // Export options
        handleClone
    };
}
