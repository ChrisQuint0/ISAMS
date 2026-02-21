import { useState, useEffect, useCallback } from 'react';
import { FacultyAnalyticsService } from '../services/FacultyAnalyticsService';
import { supabase } from '@/lib/supabaseClient';

export function useFacultyAnalytics() {
    const [overview, setOverview] = useState({
        completion_rate: 0,
        submitted_count: 0,
        total_required: 0,
        dept_average: 0
    });
    const [timeline, setTimeline] = useState([]);
    const [history, setHistory] = useState([]);
    const [courseAnalytics, setCourseAnalytics] = useState([]);
    const [onTimeStats, setOnTimeStats] = useState({
        on_time_count: 0,
        late_count: 0,
        total_count: 0,
        on_time_rate: 0
    });

    // Semester/Year filter state
    const [semester, setSemester] = useState(null);
    const [academicYear, setAcademicYear] = useState(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Dynamic Options
    const [options, setOptions] = useState({ semesters: [], academic_years: [] });

    const loadOptions = useCallback(async () => {
        try {
            // Fetch distinct semesters and years from courses_fs (or improved source later)
            // Using a direct query or rpc if available, but for now direct query is fine as per admin hook pattern
            const { data } = await supabase
                .from('courses_fs')
                .select('semester, academic_year');

            if (data) {
                const sems = [...new Set(data.map(c => c.semester))].filter(Boolean).sort();
                const years = [...new Set(data.map(c => c.academic_year))].filter(Boolean).sort().reverse();
                setOptions({ semesters: sems, academic_years: years });
            }
        } catch (err) {
            console.error('Failed to load filter options:', err);
        }
    }, []);

    const loadAnalytics = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [overviewData, timelineData, historyData, courseData, onTimeData] = await Promise.all([
                FacultyAnalyticsService.getAnalyticsOverview(),
                FacultyAnalyticsService.getSubmissionTimeline(semester, academicYear),
                FacultyAnalyticsService.getSubmissionHistory(),
                FacultyAnalyticsService.getCourseAnalytics(),
                FacultyAnalyticsService.getOnTimeStats()
            ]);

            setOverview(overviewData || {
                completion_rate: 0,
                submitted_count: 0,
                total_required: 0,
                dept_average: 0
            });
            setTimeline(timelineData || []);
            setHistory(historyData || []);
            setCourseAnalytics(courseData || []);
            setOnTimeStats(onTimeData || {
                on_time_count: 0,
                late_count: 0,
                total_count: 0,
                on_time_rate: 0
            });
        } catch (err) {
            console.error(err);
            setError('Failed to load analytics data.');
            setTimeout(() => setError(null), 3000);
        } finally {
            setLoading(false);
        }
    }, [semester, academicYear]);

    // Re-fetch when filter changes
    useEffect(() => {
        loadAnalytics();
        loadOptions(); // Call loadOptions here
    }, [loadAnalytics, loadOptions]); // Added loadOptions to dependencies

    // Update timeline filter — triggers re-fetch via useEffect
    const setTimelineFilter = useCallback((newSemester, newAcademicYear) => {
        setSemester(newSemester || null);
        setAcademicYear(newAcademicYear || null);
    }, []);

    return {
        overview,
        timeline,
        history,
        courseAnalytics,
        onTimeStats,
        semester,
        academicYear,
        setTimelineFilter,
        options, // Added options to the returned object
        loading,
        error,
        refreshAnalytics: loadAnalytics
    };
}
