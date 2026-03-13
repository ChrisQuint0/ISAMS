import { useState, useEffect } from 'react';
import { FacultyResourceService } from '../services/FacultyResourceService';
import { supabase } from '@/lib/supabaseClient';

export function useFacultyResources() {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [faqs, setFaqs] = useState([]);
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        loadTemplates();
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
            setTimeout(() => setError(null), 3000);
        } finally {
            setLoading(false);
        }
    };

    const loadFAQs = async () => {
        try {
            const data = await FacultyResourceService.getFAQs();
            setFaqs(data || []);
        } catch (err) {
            console.error(err);
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

    return {
        templates,
        loading,
        error,
        loadTemplates,
        loadFAQs,
        loadCategories,
        faqs,
        categories,
    };
}
