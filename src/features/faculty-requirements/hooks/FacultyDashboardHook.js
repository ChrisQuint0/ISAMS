import { useState, useEffect, useCallback } from 'react';
import { FacultyDashboardService } from '../services/FacultyDashboardService';
import { supabase } from '@/lib/supabaseClient';

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
    const [settings, setSettings] = useState({ semester: '', academic_year: '' });

    const fetchDashboardData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [statsData, coursesData, activityData, notificationsData, settingsResponse] = await Promise.all([
                FacultyDashboardService.getDashboardStats(),
                FacultyDashboardService.getCoursesStatus(),
                FacultyDashboardService.getRecentActivity(),
                FacultyDashboardService.getNotifications(),
                supabase.from('systemsettings_fs').select('setting_key, setting_value').in('setting_key', ['current_semester', 'current_academic_year'])
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

            // FIX 1: Properly map the array of database rows into an object
            if (settingsResponse && settingsResponse.data) {
                const newSettings = { semester: '', academic_year: '' };
                settingsResponse.data.forEach(s => {
                    if (s.setting_key === 'current_semester') newSettings.semester = s.setting_value;
                    if (s.setting_key === 'current_academic_year') newSettings.academic_year = s.setting_value;
                });
                setSettings(newSettings);
            }

        } catch (err) {
            console.error(err);
            setError('Failed to load dashboard data.');
            // FIX 2: Clear sticky errors
            setTimeout(() => setError(null), 3000);
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
        settings, // Export settings
        courses,
        recentActivity,
        notifications,
        loading,
        error,
        refreshDashboard: fetchDashboardData,
        markNotificationAsRead
    };
}
