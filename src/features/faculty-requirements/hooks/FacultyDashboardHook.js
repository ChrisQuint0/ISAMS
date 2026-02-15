import { useState, useEffect, useCallback } from 'react';
import { FacultyDashboardService } from '../services/FacultyDashboardService';

export function useFacultyDashboard() {
    const [stats, setStats] = useState({
        overall_progress: 0,
        pending_count: 0,
        submitted_count: 0,
        days_remaining: 0,
        next_deadline: null
    });

    const [courses, setCourses] = useState([]);
    const [recentActivity, setRecentActivity] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchDashboardData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [statsData, coursesData, activityData] = await Promise.all([
                FacultyDashboardService.getDashboardStats(),
                FacultyDashboardService.getCoursesStatus(),
                FacultyDashboardService.getRecentActivity()
            ]);

            setStats(statsData || {
                overall_progress: 0,
                pending_count: 0,
                submitted_count: 0,
                days_remaining: 0,
                next_deadline: null
            });
            setCourses(coursesData || []);
            setRecentActivity(activityData || []);
        } catch (err) {
            console.error(err);
            setError('Failed to load dashboard data.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    return {
        stats,
        courses,
        recentActivity,
        loading,
        error,
        refreshDashboard: fetchDashboardData
    };
}
