import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';

export function useLabAnalytics(labName, dateFrom, dateTo) {
    const [rawLogs, setRawLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dataBounds, setDataBounds] = useState({ first: null, last: null });

    // Find absolute data range for this lab
    useEffect(() => {
        const fetchBounds = async () => {
            if (!labName) return;
            const { data } = await supabase
                .from('attendance_logs_lm')
                .select('time_in, lab_schedules_lm!inner(room)')
                .eq('lab_schedules_lm.room', labName)
                .order('time_in', { ascending: true });

            if (data?.length > 0) {
                setDataBounds({
                    first: data[0].time_in.split('T')[0],
                    last: data[data.length - 1].time_in.split('T')[0]
                });
            }
        };
        fetchBounds();
    }, [labName]);

    // Fetch filtered data
    useEffect(() => {
        const fetchAnalyticsData = async () => {
            if (!labName || !dateFrom || !dateTo) return;
            try {
                setLoading(true);
                const { data, error } = await supabase
                    .from('attendance_logs_lm')
                    .select(`
                        id, time_in, time_out, log_type, pc_no, student_no,
                        students_lists_lm (student_no, full_name, section_block, course, year_level),
                        lab_schedules_lm!inner (room, course_code, subject_name, time_end)
                    `)
                    .eq('lab_schedules_lm.room', labName)
                    .gte('time_in', `${dateFrom}T00:00:00.000Z`)
                    .lte('time_in', `${dateTo}T23:59:59.999Z`);

                if (error) throw error;
                setRawLogs(data || []);
            } catch (error) {
                console.error("Fetch Error:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAnalyticsData();
    }, [labName, dateFrom, dateTo]);

    // Metrics calculation logic remains same...
    const metrics = useMemo(() => {
        if (!rawLogs.length) return { peakHour: "N/A", peakDay: "N/A", avgDurationStr: "0h 0m", topSection: "N/A", topSectionCount: 0, laptopPercentage: 0, pcPercentage: 0, totalSessions: 0 };
        
        let totalMs = 0, completed = 0, laptop = 0;
        const hrCounts = {}, dayCounts = {}, secCounts = {};
        const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

        rawLogs.forEach(log => {
            if (log.log_type === 'Laptop') laptop++;
            const s = log.students_lists_lm;
            const sec = s ? `${s.course}${s.year_level}${s.section_block}` : 'Unknown';
            secCounts[sec] = (secCounts[sec] || 0) + 1;

            if (log.time_in) {
                const d = new Date(log.time_in);
                const hr = d.getHours();
                const dy = days[d.getDay()];
                hrCounts[hr] = (hrCounts[hr] || 0) + 1;
                dayCounts[dy] = (dayCounts[dy] || 0) + 1;

                if (log.time_out) {
                    const dur = new Date(log.time_out) - d;
                    if (dur > 0 && dur < 43200000) { totalMs += dur; completed++; }
                }
            }
        });

        const getPeak = (c) => Object.keys(c).reduce((a, b) => c[a] > c[b] ? a : b, "N/A");
        const phNum = parseInt(getPeak(hrCounts));
        const phStr = !isNaN(phNum) ? `${phNum % 12 || 12} ${phNum >= 12 ? 'PM' : 'AM'}` : "N/A";
        const top = getPeak(secCounts);

        return {
            peakHour: phStr, peakDay: getPeak(dayCounts).slice(0, 3), 
            avgDurationStr: completed ? `${Math.floor((totalMs / completed / 3600000))}h ${Math.floor((totalMs / completed / 60000) % 60)}m` : "0h 0m",
            topSection: top, topSectionCount: secCounts[top] || 0,
            laptopPercentage: Math.round((laptop / rawLogs.length) * 100),
            pcPercentage: Math.round(((rawLogs.length - laptop) / rawLogs.length) * 100),
            totalSessions: rawLogs.length
        };
    }, [rawLogs]);

    return { loading, metrics, rawLogs, dataBounds };
}