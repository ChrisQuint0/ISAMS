import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

// --- DATA FORMATTERS ---

// 1. Time Formatter ("14:00:00" -> "02:00 PM")
const formatDBTime = (timeStr) => {
    if (!timeStr) return "";
    if (timeStr.includes("AM") || timeStr.includes("PM")) return timeStr; 
    const [h, m] = timeStr.split(':');
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour.toString().padStart(2, '0')}:${m} ${ampm}`;
};

// 2. Section Formatters
const formatSectionForUI = (section) => {
    if (!section) return "N/A";
    // Clean any accidental spaces/hyphens first, then force uppercase (e.g., bsit 3a -> BSIT3A)
    const clean = section.replace(/[\s-]/g, '').toUpperCase();
    // Regex matches the letters then the numbers, and injects a hyphen (e.g., BSIT3A -> BSIT-3A)
    const match = clean.match(/^([A-Z]+)(\d.*)$/);
    return match ? `${match[1]}-${match[2]}` : clean;
};

const formatSectionForDB = (section) => {
    if (!section) return "";
    // Strips out spaces and hyphens before saving to DB (e.g., BSIT-3A -> BSIT3A)
    return section.replace(/[\s-]/g, '').toUpperCase();
};

// 3. Professor Formatters
const formatProfForUI = (prof) => {
    if (!prof || prof.trim() === "") return "TBA";
    const clean = prof.trim();
    // If it already has "Prof." written, just ensure proper casing. Otherwise, prepend it.
    if (/^prof\.?\s+/i.test(clean)) {
        return clean.replace(/^prof\.?\s+/i, 'Prof. ');
    }
    return `Prof. ${clean}`;
};

const formatProfForDB = (prof) => {
    if (!prof) return "";
    // Removes "Prof." (case insensitive) and trims whitespace before saving
    return prof.replace(/^prof\.?\s*/i, '').trim();
};


export function useLabSchedule(labName) {
    const [rowData, setRowData] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchSchedules = useCallback(async () => {
        if (!labName) return;
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('lab_schedules_lm')
                .select('*')
                .eq('room', labName);

            if (error) throw error;
            
            const mappedData = data.map(item => ({
                id: item.id,
                subject: item.course_code,
                desc: item.subject_name,
                
                // Formatted for UI
                prof: formatProfForUI(item.professor),
                section: formatSectionForUI(item.section_block),
                
                day: item.day,
                time_start: formatDBTime(item.time_start),
                time_end: formatDBTime(item.time_end),
                raw_time_start: item.time_start, 
                raw_time_end: item.time_end     
            }));

            setRowData(mappedData);
        } catch (error) {
            console.error("Error fetching schedules:", error);
        } finally {
            setLoading(false);
        }
    }, [labName]);

    useEffect(() => {
        fetchSchedules();
    }, [fetchSchedules]);

    const saveSchedule = async (payload, editingId = null) => {
        try {
            const formatTimeForDB = (t) => t && t.length === 5 ? `${t}:00` : t;

            // Apply DB formatters directly to the payload before inserting
            const dbPayload = {
                ...payload,
                time_start: formatTimeForDB(payload.time_start),
                time_end: formatTimeForDB(payload.time_end),
                section_block: formatSectionForDB(payload.section_block),
                professor: formatProfForDB(payload.professor)
            };

            if (editingId) {
                const { error } = await supabase.from('lab_schedules_lm').update(dbPayload).eq('id', editingId);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('lab_schedules_lm').insert([dbPayload]);
                if (error) throw error;
            }
            await fetchSchedules(); 
            return { success: true };
        } catch (error) {
            console.error("Save error:", error);
            return { success: false, error };
        }
    };

    const deleteSchedule = async (id) => {
        try {
            const { error } = await supabase.from('lab_schedules_lm').delete().eq('id', id);
            if (error) throw error;
            await fetchSchedules(); 
            return { success: true };
        } catch (error) {
            console.error("Delete error:", error);
            return { success: false, error };
        }
    };

    return { rowData, loading, saveSchedule, deleteSchedule };
}