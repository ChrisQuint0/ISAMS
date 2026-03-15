import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { logAuditEvent } from '../utils/auditLogger';

export function usePCManagement(labName) {
    const [stations, setStations] = useState([]);
    const [maintenanceHistory, setMaintenanceHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        if (!labName) return;
        setLoading(true);

        try {
            // 1. SMART FIX: Identify the exact current class schedule
            const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
            const today = dayNames[new Date().getDay()];
            const currentTime = new Date().toLocaleTimeString('en-GB', { hour12: false });

            const { data: activeSchedule } = await supabase
                .from('lab_schedules_lm')
                .select('id, section_block')
                .eq('day', today)
                .eq('room', labName)
                .lte('time_start', currentTime)
                .gte('time_end', currentTime)
                .maybeSingle();

            // 2. Fetch PC Station Hardware Status
            const { data: dbStations, error: stationErr } = await supabase
                .from('pc_stations_lm')
                .select('*')
                .eq('room', labName);
            if (stationErr) throw stationErr;

            // 3. Fetch Active Users ONLY for the current active schedule
            let activeLogs = [];
            if (activeSchedule) {
                const { data: logs, error: logErr } = await supabase
                    .from('attendance_logs_lm')
                    .select(`
                        id, pc_no, log_type, time_in,
                        students_lists_lm ( full_name, student_no, is_laptop_user ),
                        lab_schedules_lm!inner ( section_block )
                    `)
                    .eq('schedule_id', activeSchedule.id) // Stops ghost students from previous classes!
                    .is('time_out', null);
                if (logErr) throw logErr;
                activeLogs = logs || [];
            }

            // 4. Fetch Maintenance History Audit Trail
            const { data: historyData, error: histErr } = await supabase
                .from('pc_maintenance_history_lm')
                .select('*')
                .eq('room', labName)
                .order('created_at', { ascending: false })
                .limit(50);
            if (histErr) throw histErr;

            const formattedHistory = historyData.map(item => {
                const d = new Date(item.created_at);
                return {
                    id: item.id,
                    pcId: item.pc_no,
                    action: item.action,
                    note: item.note,
                    date: d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
                    time: d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
                };
            });

            // 5. Build the grid safely
            const capacity = labName.toLowerCase().includes('defense') ? 20 : 40;
            const mergedStations = Array.from({ length: capacity }, (_, i) => {
                const num = i + 1;
                const pcId = `PC-${num.toString().padStart(2, '0')}`;

                const dbStat = dbStations?.find(s => s.pc_no === pcId);
                const activeUser = activeLogs?.find(l => l.pc_no?.toString().padStart(2, '0') === num.toString().padStart(2, '0'));

                let status = dbStat?.status || "Available";
                let userObj = null;

                if (status !== "Maintenance" && activeUser) {
                    status = activeUser.log_type === "Laptop" ? "Laptop" : "Occupied";
                    userObj = {
                        name: activeUser.students_lists_lm?.full_name || "Unknown",
                        studentId: activeUser.students_lists_lm?.student_no || "N/A",
                        section: activeUser.lab_schedules_lm?.section_block || "N/A",
                        timeIn: new Date(activeUser.time_in).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
                        logId: activeUser.id
                    };
                }

                return {
                    id: pcId,
                    status: status,
                    hours: dbStat?.usage_hours || 0,
                    maintenanceNote: dbStat?.maintenance_note || null,
                    maintenanceDate: dbStat?.last_maintenance
                        ? new Date(dbStat.last_maintenance).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                        : null,
                    user: userObj
                };
            });

            setStations(mergedStations);
            setMaintenanceHistory(formattedHistory);
        } catch (err) {
            console.error("Error fetching PC Management data:", err);
        } finally {
            setLoading(false);
        }
    }, [labName]);

    useEffect(() => {
        fetchData();
        const sub1 = supabase.channel('pc_stations_changes').on('postgres_changes', { event: '*', table: 'pc_stations_lm' }, fetchData).subscribe();
        const sub2 = supabase.channel('pc_history_changes').on('postgres_changes', { event: '*', table: 'pc_maintenance_history_lm' }, fetchData).subscribe();
        const sub3 = supabase.channel('attendance_changes_pc').on('postgres_changes', { event: '*', table: 'attendance_logs_lm' }, fetchData).subscribe();
        const sub4 = supabase.channel('schedule_changes_pc').on('postgres_changes', { event: '*', table: 'lab_schedules_lm' }, fetchData).subscribe(); // Updates map instantly when class changes

        return () => {
            supabase.removeChannel(sub1);
            supabase.removeChannel(sub2);
            supabase.removeChannel(sub3);
            supabase.removeChannel(sub4);
        };
    }, [fetchData]);

    const updateStudentPreference = async (pcIds, isLaptop) => {
        const studentsToUpdate = stations
            .filter(s => pcIds.includes(s.id) && s.user?.studentId)
            .map(s => s.user.studentId);

        if (studentsToUpdate.length > 0) {
            await supabase.from('students_lists_lm').update({ is_laptop_user: isLaptop }).in('student_no', studentsToUpdate);
        }
    };

    const upsertStations = async (pcIds, updates) => {
        const payloads = pcIds.map(pcId => ({ room: labName, pc_no: pcId, ...updates }));
        const { error } = await supabase.from('pc_stations_lm').upsert(payloads, { onConflict: 'room, pc_no' });
        return !error;
    };

    const updateActiveLogsMode = async (pcIds, mode) => {
        // SMART FIX: Restrict the backend update to the current class schedule
        const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const today = dayNames[new Date().getDay()];
        const currentTime = new Date().toLocaleTimeString('en-GB', { hour12: false });

        const { data: activeSchedule } = await supabase
            .from('lab_schedules_lm')
            .select('id')
            .eq('day', today)
            .eq('room', labName)
            .lte('time_start', currentTime)
            .gte('time_end', currentTime)
            .maybeSingle();

        if (!activeSchedule) return;

        const pcNumbers = pcIds.map(id => parseInt(id.replace('PC-', ''), 10));
        const { data: activeLogs, error: fetchErr } = await supabase
            .from('attendance_logs_lm')
            .select('id')
            .eq('schedule_id', activeSchedule.id) // Locked to current class
            .in('pc_no', pcNumbers)
            .is('time_out', null);

        if (fetchErr) return;

        if (activeLogs && activeLogs.length > 0) {
            const logIds = activeLogs.map(log => log.id);
            await supabase.from('attendance_logs_lm').update({ log_type: mode }).in('id', logIds);
        }
    };

    const convertToLaptop = async (pcIds) => {
        await upsertStations(pcIds, { status: 'Laptop' });
        await updateActiveLogsMode(pcIds, 'Laptop');
        await updateStudentPreference(pcIds, true);
        await fetchData();
    };

    const convertToPC = async (pcIds) => {
        await upsertStations(pcIds, { status: 'Available' });
        await updateActiveLogsMode(pcIds, 'PC');
        await updateStudentPreference(pcIds, false);
        await fetchData();
    };

    const flagMaintenance = async (pcIds, note, actorName = "Admin") => {
        const success = await upsertStations(pcIds, {
            status: 'Maintenance',
            maintenance_note: note,
            last_maintenance: new Date().toISOString()
        });
        if (success) {
            const historyPayloads = pcIds.map(pcId => ({ room: labName, pc_no: pcId, action: 'Flagged', note: note }));
            await supabase.from('pc_maintenance_history_lm').insert(historyPayloads);

            await logAuditEvent({
                labName: labName,
                actor: actorName,
                category: "PC Management",
                action: pcIds.length > 1 ? "Bulk Flag Maintenance" : "Flag Maintenance",
                description: `Flagged ${pcIds.join(', ')} for maintenance. Note: ${note}`,
                severity: "Warning"
            });
        }
        await fetchData();
    };

    const clearMaintenance = async (pcIds, actorName = "Admin") => {
        const success = await upsertStations(pcIds, {
            status: 'Available',
            maintenance_note: null,
            usage_hours: 0
        });
        if (success) {
            const historyPayloads = pcIds.map(pcId => ({ room: labName, pc_no: pcId, action: 'Cleared', note: 'Hardware resolved & usage timer reset.' }));
            await supabase.from('pc_maintenance_history_lm').insert(historyPayloads);

            await logAuditEvent({
                labName: labName,
                actor: actorName,
                category: "PC Management",
                action: pcIds.length > 1 ? "Bulk Clear Maintenance" : "Clear Maintenance",
                description: `Cleared maintenance flag for ${pcIds.join(', ')}. Details: Hardware resolved & usage timer reset.`,
                severity: "Success"
            });
        }
        await fetchData();
    };

    const resetTimers = async (pcIds) => {
        await upsertStations(pcIds, { usage_hours: 0 });
        await fetchData();
    };

    return { stations, maintenanceHistory, loading, convertToLaptop, convertToPC, flagMaintenance, clearMaintenance, resetTimers };
}