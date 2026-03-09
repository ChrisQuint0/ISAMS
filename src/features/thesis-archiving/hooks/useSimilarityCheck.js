import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { similarityService } from "../services/similarityService";

export function useSimilarityCheck() {
    const [viewState, setViewState] = useState("idle"); // idle | processing | result | error
    const [currentScanId, setCurrentScanId] = useState(null);
    const [analyzedFile, setAnalyzedFile] = useState(null);
    const [scanResult, setScanResult] = useState(null);        // from analyze endpoint
    const [recentScans, setRecentScans] = useState([]);
    const [recentScansLoading, setRecentScansLoading] = useState(true);
    const [threshold, setThreshold] = useState(20);
    const [error, setError] = useState(null);
    const [isRerunning, setIsRerunning] = useState(false);

    // Load recent scans + threshold on mount
    useEffect(() => {
        loadRecentScans();
        loadThreshold();
    }, []);

    const loadRecentScans = async () => {
        setRecentScansLoading(true);
        try {
            const data = await similarityService.fetchRecentScans();
            setRecentScans(data);
        } catch (err) {
            console.error("[useSimilarityCheck] Failed to load recent scans:", err);
        } finally {
            setRecentScansLoading(false);
        }
    };

    const loadThreshold = async () => {
        try {
            const t = await similarityService.getThreshold();
            setThreshold(t);
        } catch (err) {
            console.error("[useSimilarityCheck] Failed to load threshold:", err);
        }
    };

    /**
     * Main flow: file is selected → extract text → save job → run analysis
     */
    const handleFileSelect = useCallback(async (file, scanType = "standard") => {
        setAnalyzedFile(file);
        setViewState("processing");
        setError(null);
        setScanResult(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            // Step 1: Extract text from file
            const extracted = await similarityService.extractText(file);
            const { title, abstract, keywords, content } = extracted;

            // Step 2: Create scan job in DB
            const scanId = await similarityService.createScanJob({
                userId: user.id,
                proposedTitle: title || null,
                fileName: file.name,
                fileSize: file.size,
                mimeType: file.type,
                scanType,
            });
            setCurrentScanId(scanId);

            // Step 3: Run NLP analysis (server processes and writes to DB)
            const result = await similarityService.runAnalysis({
                scanId,
                userId: user.id,
                title,
                abstract,
                keywords,
                content,
                scanType,
            });

            setScanResult(result);
            setViewState("result");

            // Refresh recent scans list
            loadRecentScans();
        } catch (err) {
            console.error("[useSimilarityCheck] Analysis failed:", err);
            setError(err.message || "Analysis failed");
            setViewState("error");
        }
    }, []);

    /**
     * Re-run with deep scan type
     */
    const handleRerunDeepScan = useCallback(async () => {
        if (!analyzedFile) return;
        setIsRerunning(true);
        await handleFileSelect(analyzedFile, "deep");
        setIsRerunning(false);
    }, [analyzedFile, handleFileSelect]);

    /**
     * Export PDF report
     */
    const handleExportPDF = useCallback(async () => {
        if (!scanResult || !currentScanId) return;
        try {
            const { queue, result } = await similarityService.fetchScanResult(currentScanId);
            const fieldScores = result?.field_scores ?? scanResult.field_scores ?? [];
            const topMatches = result?.top_matches ?? scanResult.top_matches ?? [];
            similarityService.exportPDF({
                queueRow: queue,
                result: result ?? scanResult,
                fieldScores,
                topMatches,
            });
        } catch (err) {
            console.error("[useSimilarityCheck] PDF export failed:", err);
        }
    }, [scanResult, currentScanId]);

    /**
     * Mark the current scan as reviewed
     */
    const handleMarkAsReviewed = useCallback(async ({ reviewStatus = "Reviewed", actionTaken, notes } = {}) => {
        if (!scanResult?.resultId) return;
        try {
            await similarityService.markAsReviewed(scanResult.resultId, { reviewStatus, actionTaken, notes });
        } catch (err) {
            console.error("[useSimilarityCheck] Mark as reviewed failed:", err);
            throw err;
        }
    }, [scanResult]);

    /**
     * Save threshold from settings modal
     */
    const handleSaveThreshold = useCallback(async (newValue) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            await similarityService.saveThreshold(newValue, user?.id);
            setThreshold(newValue);
        } catch (err) {
            console.error("[useSimilarityCheck] Save threshold failed:", err);
            throw err;
        }
    }, []);

    /**
     * Reset to idle state
     */
    const resetAnalysis = useCallback(() => {
        setViewState("idle");
        setAnalyzedFile(null);
        setScanResult(null);
        setCurrentScanId(null);
        setError(null);
    }, []);

    return {
        viewState,
        analyzedFile,
        scanResult,
        recentScans,
        recentScansLoading,
        threshold,
        error,
        isRerunning,
        handleFileSelect,
        handleRerunDeepScan,
        handleExportPDF,
        handleMarkAsReviewed,
        handleSaveThreshold,
        resetAnalysis,
    };
}
