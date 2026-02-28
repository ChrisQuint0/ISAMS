import { useState, useEffect } from 'react';
import { FacultySubmissionService } from '../services/FacultySubmissionService';
import { supabase } from '@/lib/supabaseClient';

export function useFacultySubmission() {
    const [courses, setCourses] = useState([]);
    const [requiredDocs, setRequiredDocs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [currentSemester, setCurrentSemester] = useState(null);
    const [currentAcademicYear, setCurrentAcademicYear] = useState(null);
    const [ocrEnabled, setOcrEnabled] = useState(true);

    const loadSettings = async () => {
        try {
            const { data } = await supabase
                .from('systemsettings_fs')
                .select('setting_key, setting_value')
                .in('setting_key', ['current_semester', 'current_academic_year', 'ocr_enabled']);

            data?.forEach(s => {
                if (s.setting_key === 'current_semester') setCurrentSemester(s.setting_value);
                if (s.setting_key === 'current_academic_year') setCurrentAcademicYear(s.setting_value);
                if (s.setting_key === 'ocr_enabled') setOcrEnabled(s.setting_value === 'true');
            });
        } catch (err) {
            console.error('Failed to load settings', err);
        }
    };

    const loadCourses = async () => {
        try {
            const data = await FacultySubmissionService.getFacultyCourses();
            setCourses(data || []);
        } catch (err) {
            console.error(err);
            setError('Failed to load courses');
            setTimeout(() => setError(null), 3000); // FIX: Clear sticky error
        }
    };

    useEffect(() => {
        loadCourses();
        loadSettings();
    }, []);

    const loadRequiredDocs = async (courseId) => {
        if (!courseId) {
            setRequiredDocs([]);
            return;
        }
        setLoading(true);
        try {
            const data = await FacultySubmissionService.getRequiredDocs(courseId);
            setRequiredDocs(data || []);
        } catch (err) {
            console.error(err);
            setError('Failed to load document requirements');
            setTimeout(() => setError(null), 3000); // FIX: Clear sticky error
        } finally {
            setLoading(false);
        }
    };

    const submitDocument = async ({ file, courseId, docTypeId, semester, academicYear }) => {
        setIsSubmitting(true);
        setError(null);
        try {
            const data = await FacultySubmissionService.uploadSubmission({
                file,
                courseId,
                docTypeId,
                semester,
                academicYear
            });
            return data;
        } catch (err) {
            console.error(err);
            setError(err.message || 'Submission failed');
            setTimeout(() => setError(null), 3000); // FIX: Clear sticky error
            return false;
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
        courses,
        requiredDocs,
        loading,
        isSubmitting,
        error,
        currentSemester,
        currentAcademicYear,
        ocrEnabled,
        loadRequiredDocs,
        submitDocument
    };
}
