import { useState } from "react";
import { supabase } from "@/lib/supabaseClient"; 

export function useLabImport() {
    const [isImporting, setIsImporting] = useState(false);
    const [importError, setImportError] = useState("");

    const uploadCsvData = async (data, importType) => {
        if (!data || data.length === 0) {
            setImportError("No data found to upload.");
            return false;
        }

        setIsImporting(true);
        setImportError("");

        const tableName = importType === "classlist" ? "students_lists" : "lab_schedules";
        
        const conflictKey = importType === "classlist" 
            ? "student_no" 
            : "course_code, section_block, day, time_start";

        try {
            const { error } = await supabase
                .from(tableName)
                .upsert(data, { onConflict: conflictKey });

            if (error) throw error;
            return true;
        } catch (err) {
            console.error("Supabase Upload Error:", err);
            setImportError(err.message);
            return false;
        } finally {
            setIsImporting(false);
        }
    };

    return { uploadCsvData, isImporting, importError };
}