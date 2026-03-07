import { supabase } from "@/lib/supabaseClient";

const BACKEND_URL = "http://localhost:3001/api/thesis";

export const thesisService = {
    /**
     * Fetch all thesis categories
     */
    async getCategories() {
        const { data, error } = await supabase
            .from("thesis_categories")
            .select("*")
            .order("name", { ascending: true });

        if (error) throw error;
        return data;
    },

    /**
     * Fetch all active research advisers via helper view
     */
    async getAdvisers() {
        const { data, error } = await supabase
            .from("vw_adviser_display")
            .select("*")
            .order("display_name", { ascending: true });

        if (error) throw error;
        return data;
    },

    /**
     * Upload research PDF to Google Drive via modular backend
     */
    async uploadToDrive(file) {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch(`${BACKEND_URL}/upload`, {
            method: "POST",
            body: formData,
        });

        const text = await response.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            throw new Error(`Server returned non-JSON response: ${text.substring(0, 100)}...`);
        }

        if (!response.ok) {
            throw new Error(data.error || "Failed to upload file to Google Drive");
        }

        return data;
    },

    /**
     * Complete multi-step thesis entry creation via backend to bypass RLS
     */
    async saveThesisEntry({ entry, authors, gdriveFile }) {
        const response = await fetch(`${BACKEND_URL}/create`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ entry, authors, gdriveFile }),
        });

        const text = await response.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            throw new Error(`Server returned non-JSON response: ${text.substring(0, 100)}...`);
        }

        if (!response.ok) {
            throw new Error(data.error || "Failed to create thesis entry");
        }

        return data;
    },

    /**
     * Fetch all thesis entries with categories and authors, with optional filtering
     */
    async getThesisEntries(filters = {}) {
        let query = supabase
            .from("thesis_entries")
            .select(`
                *,
                category:thesis_categories(name),
                authors:thesis_authors(first_name, last_name, display_order)
            `)
            .eq('is_deleted', false);

        if (filters.year && filters.year !== 'all') {
            query = query.eq('publication_year', parseInt(filters.year));
        }

        if (filters.categoryId && filters.categoryId !== 'all') {
            query = query.eq('category_id', filters.categoryId);
        }

        if (filters.search) {
            const searchTerm = `%${filters.search}%`;
            // Using logic to search across multiple fields
            // Supabase/PostgREST doesn't support complex OR across joined tables easily in a single string,
            // but we can search title, description, and abstract directly.
            // For authors, we might need a separate approach or a view if it gets too complex,
            // but for now let's search the main fields.
            query = query.or(`title.ilike.${searchTerm},description.ilike.${searchTerm},abstract.ilike.${searchTerm}`);
        }

        const { data, error } = await query.order("created_at", { ascending: false });

        if (error) throw error;
        return data;
    },

    /**
     * Fetch all unique publication years
     */
    async getPublicationYears() {
        const { data, error } = await supabase
            .from("thesis_entries")
            .select("publication_year")
            .eq('is_deleted', false)
            .order("publication_year", { ascending: false });

        if (error) throw error;

        // Return unique years
        const years = [...new Set(data.map(item => item.publication_year))];
        return years;
    },

    /**
     * Fetch a single thesis by ID with all details
     */
    async getThesisById(id) {
        const { data, error } = await supabase
            .from("thesis_entries")
            .select(`
                *,
                category:thesis_categories(name),
                adviser:thesis_advisers(first_name, last_name, title, credentials),
                authors:thesis_authors(first_name, last_name, display_order),
                files:thesis_files(*)
            `)
            .eq("id", id)
            .single();

        if (error) throw error;
        return data;
    },
    /**
     * Get backend download URL for a thesis file
     */
    getDownloadUrl(fileId) {
        return `${BACKEND_URL}/download/${fileId}`;
    }
};
