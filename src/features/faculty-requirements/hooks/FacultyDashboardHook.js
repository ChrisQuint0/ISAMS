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
    const [facultyProfile, setFacultyProfile] = useState(null);
    const [templates, setTemplates] = useState([]);

    const fetchDashboardData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { data: authData } = await supabase.auth.getUser();
            const userId = authData.user?.id;

            if (!userId) throw new Error('User not authenticated');

            console.log("Fetching dashboard data for user:", userId);

            const [statsData, coursesData, activityData, notificationsData, settingsResponse, facultyResponse, templatesResponse] = await Promise.all([
                FacultyDashboardService.getDashboardStats(),
                FacultyDashboardService.getCoursesStatus(),
                FacultyDashboardService.getRecentActivity(),
                FacultyDashboardService.getNotifications(),
                supabase.from('systemsettings_fs').select('setting_key, setting_value').in('setting_key', ['current_semester', 'current_academic_year']),
                supabase.from('faculty_fs').select('first_name, last_name, employment_type').eq('user_id', userId).maybeSingle(),
                supabase.from('templates_fs').select('*').eq('is_active_default', true)
            ]);

            console.log("Faculty Response:", facultyResponse);
            console.log("Templates Response:", templatesResponse);

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

            if (facultyResponse && facultyResponse.data && facultyResponse.data.first_name) {
                setFacultyProfile(facultyResponse.data);
            } else {
                // Fallback to auth metadata
                const meta = authData.user?.user_metadata;
                const name = meta?.full_name || meta?.name ||
                    (meta?.first_name ? `${meta.first_name} ${meta.last_name || ''}`.trim() : null);

                if (name) {
                    const parts = name.split(' ');
                    setFacultyProfile({
                        first_name: parts[0],
                        last_name: parts.slice(1).join(' '),
                        department: 'N/A'
                    });
                } else if (authData.user?.email) {
                    setFacultyProfile({
                        first_name: authData.user.email.split('@')[0],
                        last_name: '',
                        department: 'N/A'
                    });
                }
            }

            if (templatesResponse && templatesResponse.data) {
                setTemplates(templatesResponse.data);
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
        facultyProfile,
        templates,
        loading,
        error,
        refreshDashboard: fetchDashboardData,
        markNotificationAsRead
    };
}
