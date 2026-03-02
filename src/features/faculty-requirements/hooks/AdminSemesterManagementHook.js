import { useState, useEffect, useCallback } from 'react';
import { semesterService } from '../services/AdminSemesterManagementService';

/**
 * Hook to manage Admin Semester Management state and operations
 */
export function useAdminSemesterManagement() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Active period settings
    const [currentSettings, setCurrentSettings] = useState({
        semester: '',
        academic_year: ''
    });

    // Historical record list
    const [history, setHistory] = useState([]);

    // List of faculty with pending work (for rollover warnings)
    const [incompleteFaculty, setIncompleteFaculty] = useState([]);

    /**
     * Primary data fetcher
     */
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [settings, historyData, incomplete] = await Promise.all([
                semesterService.getSemesterSettings(),
                semesterService.getSemesterHistory(),
                semesterService.getIncompleteFaculty()
            ]);

            setCurrentSettings(settings);
            setHistory(historyData);
            setIncompleteFaculty(incomplete);
        } catch (err) {
            console.error('[SemesterHook] Load failed:', err);
            setError("Failed to load semester management data.");
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial load
    useEffect(() => {
        fetchData();
    }, [fetchData]);

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
            setTimeout(() => setError(null), 3000);
            return false;
        }
    };

    /**
     * Execute Semester Rollover
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

            // Refresh all data after rollover
            await fetchData();

            setSuccess(resultMessage || "Semester rollover completed successfully.");
            setTimeout(() => setSuccess(null), 5000);
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
        loading,
        error,
        success,
        currentSettings,
        history,
        incompleteFaculty,
        updateSettings,
        triggerRollover,
        refresh: fetchData,
        setError,
        setSuccess
    };
}
