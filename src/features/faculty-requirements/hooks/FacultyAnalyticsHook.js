import { useState, useEffect, useCallback } from 'react';
import { FacultyAnalyticsService } from '../services/FacultyAnalyticsService';

export function useFacultyAnalytics() {
    const [overview, setOverview] = useState({
        completion_rate: 0,
        submitted_count: 0,
        total_required: 0,
        dept_average: 0
    });
    const [timeline, setTimeline] = useState([]);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadAnalytics = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [overviewData, timelineData, historyData] = await Promise.all([
                FacultyAnalyticsService.getAnalyticsOverview(),
                FacultyAnalyticsService.getSubmissionTimeline(),
                FacultyAnalyticsService.getSubmissionHistory()
            ]);

            setOverview(overviewData || {
                completion_rate: 0,
                submitted_count: 0,
                total_required: 0,
                dept_average: 0
            });
            setTimeline(timelineData || []);
            setHistory(historyData || []);
        } catch (err) {
            console.error(err);
            setError('Failed to load analytics data.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadAnalytics();
    }, [loadAnalytics]);

    return {
        overview,
        timeline,
        history,
        loading,
        error,
        refreshAnalytics: loadAnalytics
    };
}
