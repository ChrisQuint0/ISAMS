import { supabase } from "@/lib/supabaseClient";
import jsPDF from "jspdf";

const SERVER_URL = "http://localhost:3000";

export const similarityService = {
    /**
     * Extract text fields from an uploaded file via the backend
     */
    async extractText(file) {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch(`${SERVER_URL}/api/similarity/extract`, {
            method: "POST",
            body: formData,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Text extraction failed");
        return data; // { rawText, title, abstract, keywords, content }
    },

    /**
     * Create a scan queue job via backend (supabaseAdmin bypasses RLS)
     */
    async createScanJob({ userId, proposedTitle, fileName, fileSize, mimeType, scanType = "standard" }) {
        const res = await fetch(`${SERVER_URL}/api/similarity/job`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, proposedTitle, fileName, fileSize, mimeType, scanType }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to create scan job");
        return data.scanId;
    },

    /**
     * Run NLP analysis via the backend — returns full result object
     */
    async runAnalysis({ scanId, userId, title, abstract, keywords, content, scanType }) {
        const res = await fetch(`${SERVER_URL}/api/similarity/analyze`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ scanId, userId, title, abstract, keywords, content, scanType }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Analysis failed");
        return data;
    },

    /**
     * Fetch full scan result from DB (for loading a past scan / PDF export)
     */
    async fetchScanResult(scanId) {
        const res = await fetch(`${SERVER_URL}/api/similarity/result/${scanId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to fetch scan result");
        return data; // { queue, result }
    },

    /**
     * Fetch last 10 scans via backend (supabaseAdmin bypasses RLS)
     */
    async fetchRecentScans() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const res = await fetch(`${SERVER_URL}/api/similarity/recent/${user.id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to fetch recent scans");
        return data;
    },

    /**
     * Get the active similarity threshold (via backend to bypass RLS)
     */
    async getThreshold() {
        try {
            const res = await fetch(`${SERVER_URL}/api/similarity/threshold`);
            const data = await res.json();
            return data.value ?? 20;
        } catch {
            return 20;
        }
    },

    /**
     * Save a new threshold value to thesis_settings (via backend to bypass RLS)
     */
    async saveThreshold(newValue, userId) {
        const res = await fetch(`${SERVER_URL}/api/similarity/threshold`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ value: newValue, updatedBy: userId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to save threshold");
    },

    /**
     * Mark a flagged review as reviewed / cleared
     */
    async markAsReviewed(scanResultId, { reviewStatus, actionTaken, notes }) {
        // First find the flagged review by scan_result_id
        const { data: reviewRow, error: findErr } = await supabase
            .from("similarity_flagged_reviews")
            .select("id")
            .eq("scan_result_id", scanResultId)
            .single();
        if (findErr) throw findErr;

        const { data: { user } } = await supabase.auth.getUser();
        const { error } = await supabase
            .from("similarity_flagged_reviews")
            .update({
                review_status: reviewStatus,
                action_taken: actionTaken || null,
                coordinator_notes: notes || null,
                reviewed_by: user?.id ?? null,
                reviewed_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .eq("id", reviewRow.id);
        if (error) throw error;
    },

    /**
     * Export scan result as a PDF using jsPDF
     */
    exportPDF({ queueRow, result, fieldScores, topMatches }) {
        const doc = new jsPDF({ unit: "mm", format: "a4" });
        const pageW = doc.internal.pageSize.getWidth();
        let y = 20;

        const addLine = (text, size = 10, bold = false, color = [30, 30, 30]) => {
            doc.setFontSize(size);
            doc.setFont("helvetica", bold ? "bold" : "normal");
            doc.setTextColor(...color);
            const lines = doc.splitTextToSize(String(text || ""), pageW - 30);
            doc.text(lines, 15, y);
            y += lines.length * (size * 0.4 + 1.5);
        };

        const gap = (n = 4) => { y += n; };

        // Header
        doc.setFillColor(21, 128, 61);
        doc.rect(0, 0, pageW, 18, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("ISAMS — Similarity Analysis Report", 15, 12);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.text(`Generated: ${new Date().toLocaleString()}`, pageW - 15, 12, { align: "right" });
        y = 28;

        // Document info
        addLine("Document Evaluated", 11, true, [21, 128, 61]);
        addLine(queueRow?.proposed_title || queueRow?.original_filename || "Untitled", 12, true);
        addLine(`File: ${queueRow?.original_filename || "N/A"}  |  Scanned: ${new Date(queueRow?.submitted_at).toLocaleDateString()}`, 9, false, [100, 100, 100]);
        gap();

        // Overall Score
        const score = result?.overall_score ?? 0;
        const status = result?.integrity_status ?? "safe";
        const statusColor = status === "high_similarity" ? [220, 38, 38] : status === "flagged" ? [217, 119, 6] : [21, 128, 61];
        addLine("Overall Similarity Score", 11, true, [21, 128, 61]);
        y += 8;
        doc.setFontSize(28);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...statusColor);
        doc.text(`${score}%`, 15, y);
        y += 6;
        doc.setFontSize(12);
        doc.setTextColor(80, 80, 80);
        doc.text(result?.integrity_label || "Safe", 15, y);
        y += 12;

        addLine(result?.integrity_detail || "", 9, false, [80, 80, 80]);
        gap(6);

        // Field scores
        addLine("Field-Level Breakdown", 11, true, [21, 128, 61]);
        gap(2);
        (fieldScores || []).sort((a, b) => a.display_order - b.display_order).forEach(f => {
            const barW = Math.round((f.score / 100) * (pageW - 60));
            doc.setFillColor(220, 220, 220);
            doc.rect(15, y - 3, pageW - 60, 4, "F");
            const fc = f.severity === "high" ? [220, 38, 38] : f.severity === "moderate" ? [217, 119, 6] : [21, 128, 61];
            doc.setFillColor(...fc);
            doc.rect(15, y - 3, barW, 4, "F");
            doc.setFontSize(9);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(50, 50, 50);
            doc.text(`${f.display_label || f.field_name}`, 15, y + 4);
            doc.setFont("helvetica", "bold");
            doc.text(`${f.score}%`, pageW - 20, y + 4, { align: "right" });
            y += 9;
        });
        gap(4);

        // Top matches
        if (topMatches?.length > 0) {
            addLine("Top Matching Records", 11, true, [21, 128, 61]);
            gap(2);
            topMatches.slice(0, 5).forEach((m, i) => {
                doc.setFontSize(9);
                doc.setFont("helvetica", "bold");
                doc.setTextColor(30, 30, 30);
                const titleLines = doc.splitTextToSize(`${i + 1}. ${m.matched_title}`, pageW - 45);
                doc.text(titleLines, 15, y);
                doc.setFont("helvetica", "bold");
                doc.setTextColor(...statusColor);
                doc.text(`${m.match_score}%`, pageW - 15, y, { align: "right" });
                y += titleLines.length * 5;
                doc.setFont("helvetica", "normal");
                doc.setTextColor(100, 100, 100);
                const authorsStr = Array.isArray(m.matched_authors) ? m.matched_authors.join(", ") : (m.matched_authors || "");
                doc.text(`${authorsStr}${m.matched_year ? ` • ${m.matched_year}` : ""}  |  Matched in: ${m.match_type || "Content"}`, 18, y);
                y += 6;
                if (y > 270) { doc.addPage(); y = 20; }
            });
        }

        // Footer
        gap(6);
        doc.setDrawColor(200, 200, 200);
        doc.line(15, y, pageW - 15, y);
        y += 4;
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.setFont("helvetica", "normal");
        doc.text(`Engine: ${result?.analysis_method || "ISAMS-NLP v1.0"}  |  Analysis Time: ${result?.analysis_duration_ms ? (result.analysis_duration_ms / 1000).toFixed(2) + "s" : "N/A"}  |  Repository: ${queueRow?.repository_size_at_scan ?? "N/A"} records`, 15, y);

        const filename = `similarity-report-${new Date().toISOString().slice(0, 10)}.pdf`;
        doc.save(filename);
    },
};
