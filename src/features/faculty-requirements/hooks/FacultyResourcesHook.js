import { useState, useEffect } from 'react';
import { FacultyResourceService } from '../services/FacultyResourceService';

export function useFacultyResources() {
    const [templates, setTemplates] = useState([]);
    const [archives, setArchives] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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

    const loadArchives = async (semester, academicYear) => {
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
        loadArchives
    };
}
