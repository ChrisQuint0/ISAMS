import { useState, useEffect } from 'react';
import { FacultyResourceService } from '../services/FacultyResourceService';

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
    const [faqs, setFaqs] = useState([]);
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        // Initial load of templates, archives, FAQs, categories
        loadTemplates();
        loadArchives(); // Load all by default? Or wait for page? The page calls load archives.
        loadFAQs();
        loadCategories();
    }, []);

    const loadTemplates = async () => {
        try {
            setLoading(true);
            const data = await FacultyResourceService.getTemplates();
            setTemplates(data || []);
        } catch (err) {
            console.error(err);
            setError('Failed to load templates');
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
        } finally {
            setLoading(false);
        }
    };

    return {
        templates,
        archives,
        loading,
        error,
        loadTemplates,
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
        faqs,
        categories
    };
}
