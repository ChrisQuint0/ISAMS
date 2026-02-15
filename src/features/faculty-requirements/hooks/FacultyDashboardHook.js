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
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchDashboardData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [statsData, coursesData, activityData, notificationsData] = await Promise.all([
                FacultyDashboardService.getDashboardStats(),
                FacultyDashboardService.getCoursesStatus(),
                FacultyDashboardService.getRecentActivity(),
                FacultyDashboardService.getNotifications()
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
            setNotifications(notificationsData || []);
        } catch (err) {
            console.error(err);
            setError('Failed to load dashboard data.');
        } finally {
            setLoading(false);
        }
    }, []);

    const markNotificationAsRead = async (id) => {
        try {
            await FacultyDashboardService.markNotificationRead(id);
            setNotifications(prev =>
                prev.map(n => n.notification_id === id ? { ...n, is_read: true } : n)
            );
        } catch (err) {
            console.error('Failed to mark notification as read:', err);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    return {
        stats,
        courses,
        recentActivity,
        notifications,
        loading,
        error,
        refreshDashboard: fetchDashboardData,
        markNotificationAsRead
    };
}
