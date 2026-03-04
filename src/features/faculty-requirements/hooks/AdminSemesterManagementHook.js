import { useState, useEffect, useCallback } from 'react';
import { semesterService } from '../services/AdminSemesterManagementService';

/**
 * Hook to manage Admin Semester Management state and operations
 */
export function useAdminSemesterManagement() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const [currentSettings, setCurrentSettings] = useState({ semester: '', academic_year: '' });
    const [history, setHistory] = useState([]);
    const [semesterStats, setSemesterStats] = useState([]);
    const [incompleteFaculty, setIncompleteFaculty] = useState([]);

    /**
     * Primary data fetcher — loads all data in parallel
     */
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [settings, historyData, stats, incomplete] = await Promise.all([
                semesterService.getSemesterSettings(),
                semesterService.getSemesterHistory(),
                semesterService.getSemesterStats(),
                semesterService.getIncompleteFaculty()
            ]);

            setCurrentSettings(settings);
            setHistory(historyData);
            setSemesterStats(stats);
            setIncompleteFaculty(incomplete);
        } catch (err) {
            console.error('[SemesterHook] Load failed:', err);
            setError("Failed to load semester management data.");
            setTimeout(() => setError(null), 4000);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    /**
     * Manually update active settings (e.g., typo fix)
     */
    const updateSettings = async (newSettings) => {
        try {
            await semesterService.updateSemesterSettings(newSettings);
            setCurrentSettings(prev => ({ ...prev, ...newSettings }));
            setSuccess("Active period updated successfully.");
            setTimeout(() => setSuccess(null), 3000);
            return true;
        } catch (err) {
            setError("Failed to update settings: " + err.message);
            setTimeout(() => setError(null), 4000);
            return false;
        }
    };

    /**
     * Execute the full Semester Rollover Protocol
     */
    const triggerRollover = async (nextSemester, nextYear) => {
        setLoading(true);
        try {
            const resultMessage = await semesterService.rolloverSemester(
                currentSettings.semester,
                currentSettings.academic_year,
                nextSemester,
                nextYear
            );

            await fetchData();

            setSuccess(resultMessage || "Semester rollover completed successfully.");
            setTimeout(() => setSuccess(null), 6000);
            return true;
        } catch (err) {
            console.error('[SemesterHook] Rollover failed:', err);
            setError("Rollover failed: " + err.message);
            setTimeout(() => setError(null), 5000);
            return false;
        } finally {
            setLoading(false);
        }
    };

    return {
        loading, error, success, setError, setSuccess,
        currentSettings,
        history,
        semesterStats,
        incompleteFaculty,
        updateSettings,
        triggerRollover,
        refresh: fetchData,
    };
}
