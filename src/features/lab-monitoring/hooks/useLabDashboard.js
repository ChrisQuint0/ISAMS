import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabaseClient";

export function useLabDashboard(labName) {
    const [clock, setClock] = useState(new Date());
    const [currentClass, setCurrentClass] = useState(null);
    const [metrics, setMetrics] = useState({
        activeOccupancy: 0,
        totalScansToday: 0,
        flaggedPCs: 0,
        pcUsers: 0,
        laptopUsers: 0,
        occupancyTrend: "0",
        isTrendUp: true,
        maxCapacity: 40 
    });
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchLiveDashboard = async () => {
        if (!labName) return;

        const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const today = dayNames[new Date().getDay()];
        const currentTime = new Date().toLocaleTimeString('en-GB', { hour12: false });
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

        try {
            // 1. Fetch Room Settings
            const { data: labSettings } = await supabase
                .from('laboratories_lm')
                .select('seat_count')
                .eq('db_name', labName)
                .maybeSingle();

            // 2. Fetch Active Schedule (Synchronized with your manual edits)
            const { data: schedule } = await supabase
                .from('lab_schedules_lm')
                .select('*')
                .eq('day', today)
                .eq('room', labName)
                .lte('time_start', currentTime)
                .gte('time_end', currentTime)
                .maybeSingle();
            
            setCurrentClass(schedule);

            // 3. Fetch Occupants
            const { data: activeLogs } = await supabase
                .from('attendance_logs_lm')
                .select('log_type, lab_schedules_lm!inner(room)')
                .is('time_out', null)
                .eq('lab_schedules_lm.room', labName);
            
            const pcCount = activeLogs?.filter(l => l.log_type === 'PC').length || 0;
            const laptopCount = activeLogs?.filter(l => l.log_type === 'Laptop').length || 0;
            const currentTotal = pcCount + laptopCount;

            // 4. Trend Logic
            const { count: pastTotal } = await supabase
                .from('attendance_logs_lm')
                .select('id, lab_schedules_lm!inner(room)', { count: 'exact', head: true })
                .eq('lab_schedules_lm.room', labName)
                .lte('time_in', oneHourAgo)
                .or(`time_out.is.null,time_out.gt.${oneHourAgo}`);

            const diff = currentTotal - (pastTotal || 0);
            const trendVal = pastTotal > 0 ? ((diff / pastTotal) * 100).toFixed(1) : (diff > 0 ? 100 : 0);

            // 5. Daily Metrics
            const { count: scanCount } = await supabase
                .from('attendance_logs_lm')
                .select('id, lab_schedules_lm!inner(room)', { count: 'exact', head: true })
                .eq('lab_schedules_lm.room', labName)
                .gte('created_at', new Date().toISOString().split('T')[0]);

            setMetrics({
                activeOccupancy: currentTotal,
                totalScansToday: scanCount || 0,
                flaggedPCs: 0, 
                pcUsers: pcCount,
                laptopUsers: laptopCount,
                occupancyTrend: Math.abs(trendVal).toString(),
                isTrendUp: diff >= 0,
                maxCapacity: labSettings?.seat_count || 40 
            });

            // 6. Audit Feed
            const { data: latestLogs } = await supabase
                .from('attendance_logs_lm')
                .select('*, students:students_lists_lm(full_name), lab_schedules_lm!inner(room)')
                .eq('lab_schedules_lm.room', labName)
                .order('created_at', { ascending: false })
                .limit(10);
            
            setActivities(latestLogs || []);
        } catch (e) { console.error(e); } 
        finally { setLoading(false); }
    };

    // System Clock
    useEffect(() => {
        const timer = setInterval(() => setClock(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Realtime Integration
    useEffect(() => {
        setLoading(true);
        fetchLiveDashboard();

        const sub = supabase.channel(`dashboard-live-${labName}`)
            // Listen for Scans
            .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance_logs_lm' }, fetchLiveDashboard)
            // Listen for Schedule Edits
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'lab_schedules_lm' }, fetchLiveDashboard)
            // Listen for Student List changes
            .on('postgres_changes', { event: '*', schema: 'public', table: 'students_lists_lm' }, fetchLiveDashboard)
            .subscribe();

        return () => supabase.removeChannel(sub);
    }, [labName]);

    return { clock, currentClass, metrics, activities, loading };
}