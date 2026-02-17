import { useState, useEffect } from 'react';
import { FacultyResourceService } from '../services/FacultyResourceService';

export function useFacultyResources() {
    const [templates, setTemplates] = useState([]);
    const [archives, setArchives] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [courseList, setCourseList] = useState([]); // List of courses with submissions
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [history, setHistory] = useState([]); // Version history for selected course

    useEffect(() => {
        // Initial load of templates
        loadTemplates();
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
        } catch (err) {
            console.error(err);
            setError('Failed to load course history');
        } finally {
            setLoading(false);
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
        courseList,
        history,
        selectedCourse
    };
}
