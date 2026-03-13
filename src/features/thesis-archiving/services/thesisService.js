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
    async uploadToDrive(file, actorInfo = {}) {
        const formData = new FormData();
        formData.append("file", file);
        if (actorInfo.actorName) formData.append("actorName", actorInfo.actorName);
        if (actorInfo.actorUserId) formData.append("actorUserId", actorInfo.actorUserId);

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
    async saveThesisEntry({ entry, authors, gdriveFile, actorInfo = {} }) {
        const response = await fetch(`${BACKEND_URL}/create`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ 
                entry, 
                authors, 
                gdriveFile,
                actorName: actorInfo.actorName,
                actorUserId: actorInfo.actorUserId
            }),
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
     * Update an existing thesis entry via backend
     */
    async updateThesisEntry({ id, entry, authors, gdriveFile, actorInfo = {} }) {
        const response = await fetch(`${BACKEND_URL}/update`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ 
                id,
                entry, 
                authors, 
                gdriveFile,
                actorName: actorInfo.actorName,
                actorUserId: actorInfo.actorUserId
            }),
        });

        const text = await response.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            throw new Error(`Server returned non-JSON response: ${text.substring(0, 100)}...`);
        }

        if (!response.ok) {
            throw new Error(data.error || "Failed to update thesis entry");
        }

        return data;
    },

    /**
     * Delete a thesis entry and its associated files
     */
    async deleteThesisEntry(id, actorInfo = {}) {
        const response = await fetch(`${BACKEND_URL}/delete`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ 
                id,
                actorName: actorInfo.actorName,
                actorUserId: actorInfo.actorUserId
            }),
        });

        const text = await response.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            throw new Error(`Server returned non-JSON response: ${text.substring(0, 100)}...`);
        }

        if (!response.ok) {
            throw new Error(data.error || "Failed to delete thesis entry");
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
     * Fetch active HTE document checklist fields (used by coordinator view)
     */
    async getHTEDocumentFields() {
        const { data, error } = await supabase
            .from("hte_document_fields")
            .select("*")
            .eq("is_active", true)
            .order("display_order", { ascending: true });

        if (error) throw error;
        return data;
    },

    /**
     * Fetch ALL HTE document checklist fields, including inactive ones.
     * Used by the student portal so inactive fields can be shown as "Not Required".
     */
    async getHTEDocumentFieldsAll() {
        const { data, error } = await supabase
            .from("hte_document_fields")
            .select("*")
            .order("display_order", { ascending: true });

        if (error) throw error;
        return data;
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
     * Fetch all HTE sections
     */
    async getSections() {
        const { data, error } = await supabase
            .from("hte_sections")
            .select("*")
            .order("name", { ascending: true });

        if (error) throw error;
        return data;
    },

    /**
     * Add a new HTE section
     */
    async addSection(section) {
        const { data, error } = await supabase
            .from("hte_sections")
            .insert([section])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Update an HTE section
     */
    async updateSection(id, updates) {
        const { data, error } = await supabase
            .from("hte_sections")
            .update(updates)
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Delete an HTE section
     */
    async deleteSection(id) {
        const { error } = await supabase
            .from("hte_sections")
            .delete()
            .eq("id", id);

        if (error) throw error;
    },
    async createHTEStudent({ studentData, password, academicYear, semester, actorInfo = {} }) {
        const response = await fetch("http://localhost:3000/api/hte/students/create", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ 
                studentData, 
                password, 
                academicYear, 
                semester,
                actorName: actorInfo.actorName,
                actorUserId: actorInfo.actorUserId
            }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to create student");
        return data.student;
    },

    async batchCreateHTEStudents({ students, academicYear, semester, actorInfo = {} }) {
        const response = await fetch("http://localhost:3000/api/hte/students/batch-create", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ 
                students, 
                academicYear, 
                semester,
                actorName: actorInfo.actorName,
                actorUserId: actorInfo.actorUserId
            }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to process batch creation");
        return data.results;
    },

    /**
     * Fetch all HTE students with joined data
     */
    async getHTEStudents(filters = {}) {
        let query = supabase
            .from("hte_ojt_students")
            .select(`
                *,
                adviser:thesis_advisers(first_name, last_name),
                section_ref:hte_sections(name),
                uploads:hte_document_uploads(*)
            `)
            .eq("is_active", true);

        // Apply potential filters here if needed
        if (filters.academic_year && filters.academic_year !== "all") {
            query = query.eq("academic_year", filters.academic_year);
        }
        if (filters.semester && filters.semester !== "all") {
            query = query.eq("semester", filters.semester);
        }

        const { data, error } = await query.order("created_at", { ascending: false });
        if (error) throw error;
        return data;
    },

    /**
     * Get backend download URL for a thesis file
     */
    getDownloadUrl(fileId) {
        return `${BACKEND_URL}/download/${fileId}`;
    },

    /**
     * Upload an HTE document
     */
    async uploadHTEDocument(studentId, fieldId, file, uploaderRole, actorInfo = {}) {
        const formData = new FormData();
        formData.append("studentId", studentId);
        formData.append("fieldId", fieldId);
        formData.append("file", file);
        if (uploaderRole) formData.append("uploadedByRole", uploaderRole);
        if (actorInfo.actorName) formData.append("actorName", actorInfo.actorName);
        if (actorInfo.actorUserId) formData.append("actorUserId", actorInfo.actorUserId);

        // Since the backend uses /api/hte/upload on localhost:3000, 
        // we'll use the BACKEND_URL, but thesis backend is 3001, global server is 3000.
        // The server.js is 3000. thesis_backend.js is 3001. 
        // Let's assume the API URL is process.env.VITE_GLOBAL_BACKEND_URL or we hardcode 3000.
        // Actually, where's BACKEND_URL defined?
        // Let's just use the same approach as create.

        try {
            const response = await fetch(`http://localhost:3000/api/hte/upload`, {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || "Failed to upload document");
            }

            return await response.json();
        } catch (error) {
            console.error("Upload error:", error);
            throw error;
        }
    },

    /**
     * Delete an HTE document
     */
    async deleteHTEDocument(studentId, fieldId, actorInfo = {}) {
        try {
            const response = await fetch(`http://localhost:3000/api/hte/delete`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ 
                    studentId, 
                    fieldId,
                    actorName: actorInfo.actorName,
                    actorUserId: actorInfo.actorUserId
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || "Failed to delete document");
            }

            return await response.json();
        } catch (error) {
            console.error("Delete error:", error);
            throw error;
        }
    },

    /**
     * Academic Year Management
     */
    async getAcademicYears() {
        const { data, error } = await supabase
            .from("thesis_academic_years")
            .select("*")
            .order("name", { ascending: false });

        if (error) throw error;
        return data;
    },

    async addAcademicYear(yearData) {
        const { data, error } = await supabase
            .from("thesis_academic_years")
            .insert([yearData])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async updateAcademicYear(id, updates) {
        // If we are setting a year as active, we should deactivate others first
        if (updates.is_active === true) {
            await supabase
                .from("thesis_academic_years")
                .update({ is_active: false })
                .neq("id", id);
        }

        const { data, error } = await supabase
            .from("thesis_academic_years")
            .update(updates)
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async deleteAcademicYear(id) {
        const { error } = await supabase
            .from("thesis_academic_years")
            .delete()
            .eq("id", id);

        if (error) throw error;
    },

    /**
     * Dashboard Data Aggregates (Views)
     */
    async getDashboardMetrics() {
        try {
            const { data, error } = await supabase
                .from("vw_dashboard_metrics")
                .select("*")
                .single();

            if (!error && data) {
                // Map archived_this_term to archived_this_year for component compatibility
                return {
                    ...data,
                    archived_this_year: data.archived_this_year || data.archived_this_term || 0,
                    total_trend: data.total_records_delta || 0,
                    archive_trend: data.archived_delta || 0
                };
            }

            // Fallback
            const currentYear = new Date().getFullYear();
            const [total, thisYear] = await Promise.all([
                supabase.from("thesis_entries").select("id", { count: 'exact', head: true }).eq('is_deleted', false),
                supabase.from("thesis_entries").select("id", { count: 'exact', head: true }).eq('is_deleted', false).eq('publication_year', currentYear)
            ]);

            return {
                total_records: total.count || 0,
                total_trend: 0,
                archived_this_year: thisYear.count || 0,
                archive_trend: 0,
                completion_rate: 100
            };
        } catch (error) {
            console.error("Error in getDashboardMetrics:", error);
            return {
                total_records: 0,
                total_trend: 0,
                archived_this_year: 0,
                archive_trend: 0,
                completion_rate: 0
            };
        }
    },

    async getDashboardMonthlyTrend() {
        try {
            const { data, error } = await supabase
                .from("vw_dashboard_monthly_trend")
                .select("*")
                .order("month", { ascending: true });

            if (!error && data && data.length > 0) return data;

            // Fallback: Last 6 months with dummy data
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const currentMonth = new Date().getMonth();
            const fallbackData = [];
            
            for (let i = 5; i >= 0; i--) {
                let mIndex = currentMonth - i;
                if (mIndex < 0) mIndex += 12;
                fallbackData.push({
                    month: mIndex + 1,
                    month_name: months[mIndex],
                    new_submissions: 0,
                    archived: 0,
                    completion_rate: 100
                });
            }
            return fallbackData;
        } catch (error) {
            console.error("Error in getDashboardMonthlyTrend fallback:", error);
            return [];
        }
    },

    async getDashboardYearlyTrend() {
        try {
            // Get data from thesis_entries grouped by publication_year
            const { data, error } = await supabase
                .from("thesis_entries")
                .select("publication_year")
                .eq("is_deleted", false);

            if (error) throw error;

            // Group by year and count
            const yearCounts = (data || []).reduce((acc, entry) => {
                const year = entry.publication_year;
                acc[year] = (acc[year] || 0) + 1;
                return acc;
            }, {});

            // Convert to array and sort by year
            const trendData = Object.entries(yearCounts)
                .map(([year, count]) => ({
                    year: parseInt(year),
                    new_submissions: count,
                    archived: count,
                    completion_rate: 100
                }))
                .sort((a, b) => a.year - b.year);

            if (trendData.length > 0) return trendData;

            // Fallback: Last 5 years with dummy data
            const currentYear = new Date().getFullYear();
            const fallbackData = [];
            for (let i = 4; i >= 0; i--) {
                fallbackData.push({
                    year: currentYear - i,
                    new_submissions: 0,
                    archived: 0,
                    completion_rate: 100
                });
            }
            return fallbackData;
        } catch (error) {
            console.error("Error in getDashboardYearlyTrend:", error);
            return [];
        }
    },

    async getDashboardRecentSubmissions() {
        try {
            const { data, error } = await supabase
                .from("vw_dashboard_recent_submissions")
                .select("*")
                .limit(10);

            if (!error && data) return data;

            // Fallback
            const { data: entries, error: entError } = await supabase
                .from("thesis_entries")
                .select(`
                    id, 
                    title, 
                    publication_year, 
                    category:thesis_categories(name)
                `)
                .eq('is_deleted', false)
                .order('created_at', { ascending: false })
                .limit(10);

            if (entError) throw entError;
            
            // Map to match view structure
            return (entries || []).map(e => ({
                id: e.id,
                title: e.title,
                publication_year: e.publication_year,
                category: e.category?.name || "Uncategorized",
                authors: "Author list..." // Simplified for dashboard view
            }));
        } catch (error) {
            console.error("Error in getDashboardRecentSubmissions fallback:", error);
            return [];
        }
    },

    async getDashboardRecentActivity() {
        try {
            // Priority 1: Use the standard audit trail view used by the Audit Trail page
            const { data, error } = await supabase
                .from("vw_audit_trail")
                .select("*")
                .order("time", { ascending: false })
                .limit(10);

            if (!error && data) {
                // Ensure field names are consistent for the dashboard UI
                return data.map(l => ({
                    ...l,
                    text: l.description,
                    action_time: l.time
                }));
            }

            // Fallback: Using ta_audit_logs directly if view is missing
            const { data: logs, error: logError } = await supabase
                .from("ta_audit_logs")
                .select("*")
                .order('created_at', { ascending: false })
                .limit(10);

            if (logError) throw logError;

            return (logs || []).map(l => ({
                ...l,
                name: l.actor_name,
                action: l.action,
                text: l.description,
                action_time: l.created_at
            }));
        } catch (error) {
            console.error("Error in getDashboardRecentActivity:", error);
            return [];
        }
    },

    async getDashboardQuickStats() {
        try {
            const { data, error } = await supabase
                .from("vw_dashboard_quick_stats")
                .select("*")
                .single();

            if (!error && data) {
                // Map view keys to component keys
                return {
                    repository_count: data.total_thesis || 0,
                    flagged_count: data.pending_similarity || 0,
                    hte_student_count: data.incomplete_trainees || 0
                };
            }
            
            // Fallback: Manually count if view is missing or empty
            const [repoRes, flaggedRes, hteRes] = await Promise.all([
                supabase.from("thesis_entries").select("id", { count: 'exact', head: true }).eq('is_deleted', false),
                supabase.from("similarity_flagged_reviews").select("id", { count: 'exact', head: true }).eq('review_status', 'Pending'),
                supabase.from("hte_ojt_students").select("id", { count: 'exact', head: true }).eq('is_active', true)
            ]);

            return {
                repository_count: repoRes.count || 0,
                flagged_count: flaggedRes.count || 0,
                hte_student_count: hteRes.count || 0
            };
        } catch (error) {
            console.error("Error in getDashboardQuickStats:", error);
            return {
                repository_count: 0,
                flagged_count: 0,
                hte_student_count: 0
            };
        }
    },

    /**
     * Settings Management
     */
    async getSettings() {
        const { data, error } = await supabase
            .from("thesis_settings")
            .select("*");

        if (error) throw error;
        
        // Convert array to object for easier consumption
        return data.reduce((acc, setting) => {
            acc[setting.key] = setting.value;
            return acc;
        }, {});
    },

    async updateSetting(key, value, userId) {
        // First check if it exists
        const { data: existing } = await supabase
            .from("thesis_settings")
            .select("id")
            .eq("key", key)
            .maybeSingle();

        if (existing) {
            const { error } = await supabase
                .from("thesis_settings")
                .update({ 
                    value: String(value), 
                    updated_by: userId, 
                    updated_at: new Date().toISOString() 
                })
                .eq("key", key);
            if (error) throw error;
        } else {
            const { error } = await supabase
                .from("thesis_settings")
                .insert([{ 
                    key, 
                    value: String(value), 
                    updated_by: userId,
                    value_type: 'string'
                }]);
            if (error) throw error;
        }
    },

    /**
     * Auth helper for settings
     */
    async getSettingsAuth() {
        return await supabase.auth.getUser();
    }
};
