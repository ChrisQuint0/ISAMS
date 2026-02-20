import { supabase } from "@/lib/supabaseClient";
import Tesseract from 'tesseract.js';
import { saveAs } from 'file-saver';

export const settingsService = {
  /**
   * Get ALL System Settings (OCR, General, Validation)
   * Renamed from getOcrSettings to getAllSettings to reflect new scope
   */
  getAllSettings: async () => {
    // Fetch all settings from the table
    const { data, error } = await supabase
      .from('systemsettings_fs')
      .select('setting_key, setting_value');

    if (error) throw error;

    // Convert array [{setting_key: 'x', setting_value: 'y'}] to object {x: y}
    const settingsMap = data.reduce((acc, curr) => {
      acc[curr.setting_key] = curr.setting_value;
      return acc;
    }, {});

    // Return with defaults for missing keys (Matches your Tabs)
    return {
      // --- OCR Defaults ---
      ocr_enabled: settingsMap.ocr_enabled === 'true',
      ocr_language: settingsMap.ocr_language || 'eng',
      ocr_confidence_threshold: parseInt(settingsMap.ocr_confidence_threshold || '80'),

      // --- General Defaults ---
      general_default_deadline: parseInt(settingsMap.general_default_deadline || '14'),
      general_grace_period: parseInt(settingsMap.general_grace_period || '3'),
      general_auto_reminders: settingsMap.general_auto_reminders || '3days',
      general_archive_retention: settingsMap.general_archive_retention || '5years',

      // --- Validation Defaults ---
      val_vision_mission: settingsMap.val_vision_mission === 'true',
      val_grading_system: settingsMap.val_grading_system === 'true',
      val_consultation_hours: settingsMap.val_consultation_hours === 'true',
      val_course_outcomes: settingsMap.val_course_outcomes === 'true',
      val_max_file_size: parseInt(settingsMap.val_max_file_size || '10'),
      val_allowed_extensions: settingsMap.val_allowed_extensions || '.pdf, .docx, .xlsx',

      // FIX: Added missing crucial system keys!
      gdrive_root_folder_id: settingsMap.gdrive_root_folder_id || '',
      current_semester: settingsMap.current_semester || '',
      current_academic_year: settingsMap.current_academic_year || ''
    };
  },

  /**
   * Get Document Types (Requirements)
   */
  getDocTypes: async () => {
    const { data, error } = await supabase
      .from('documenttypes_fs')
      .select('*')
      .order('type_name');
    if (error) throw error;
    return data;
  },

  /**
   * Upsert Document Type
   */
  upsertDocType: async (docType) => {
    const payload = {
      type_name: docType.name || docType.type_name,
      description: docType.folder || docType.description, // Map UI 'folder' to DB description/folder
      is_active: docType.is_active,
      required_by_default: docType.required
    };
    if (docType.id) payload.doc_type_id = docType.id;

    const { data, error } = await supabase
      .from('documenttypes_fs')
      .upsert(payload)
      .select();
    if (error) throw error;
    return data;
  },

  /**
   * Delete Document Type
   */
  deleteDocType: async (id) => {
    const { error } = await supabase.from('documenttypes_fs').delete().eq('doc_type_id', id);
    if (error) throw error;
  },

  /**
   * Get Templates
   */
  getTemplates: async () => {
    const { data, error } = await supabase.from('templates_fs').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  addTemplate: async (file, category, description) => {
    // 1. Upload
    const fileName = `templates/${Date.now()}_${file.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('faculty_documents')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('faculty_documents')
      .getPublicUrl(fileName);

    // 2. Insert
    const { data, error } = await supabase
      .from('templates_fs')
      .insert({
        title: file.name,
        description: description || '',
        category: category || 'General',
        file_url: publicUrl,
        file_size_bytes: file.size
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  deleteTemplate: async (templateId) => {
    // Note: We could also delete from storage, but for now just DB record
    const { error } = await supabase.from('templates_fs').delete().eq('template_id', templateId);
    if (error) throw error;
  },

  /**
   * Save a single setting (Generic)
   */
  saveSetting: async (key, value) => {
    const { error } = await supabase.rpc('upsert_setting_fs', {
      p_key: key,
      p_value: String(value)
    });
    if (error) throw error;
  },

  /**
   * OCR Queue & Processing (Existing Logic)
   */
  getQueue: async () => {
    const { data, error } = await supabase.rpc('get_pending_ocr_jobs_fs');
    if (error) throw error;
    return data;
  },

  runOCR: async (fileUrlOrBlob, language = 'eng') => {
    try {
      const result = await Tesseract.recognize(fileUrlOrBlob, language);
      return {
        text: result.data.text,
        confidence: result.data.confidence,
        success: true
      };
    } catch (err) {
      console.error("OCR Failed:", err);
      return { success: false, error: err.message };
    }
  },

  completeJob: async (jobId, submissionId, text, success, errorMsg) => {
    await supabase.rpc('complete_ocr_job_fs', {
      p_job_id: jobId,
      p_submission_id: submissionId,
      p_text: text || '',
      p_status: success ? 'COMPLETED' : 'FAILED',
      p_error: errorMsg
    });
  },

  /**
   * --- Faculty Management ---
   */
  getFaculty: async () => {
    const { data, error } = await supabase
      .from('faculty_fs')
      .select('*')
      .order('last_name');
    if (error) throw error;
    return data;
  },

  addFaculty: async (facultyData) => {
    // facultyData: { first_name, last_name, email, department, faculty_id }
    const { data, error } = await supabase
      .from('faculty_fs')
      .insert([facultyData])
      .select();
    if (error) throw error;
    return data[0];
  },

  updateFacultyStatus: async (facultyId, isActive) => {
    const { error } = await supabase
      .from('faculty_fs')
      .update({ is_active: isActive })
      .eq('faculty_id', facultyId);
    if (error) throw error;
  },

  /**
   * --- Course Management ---
   */
  getCourses: async () => {
    const { data, error } = await supabase.rpc('get_admin_courses_fs');
    if (error) throw error;
    return data;
  },

  upsertCourse: async (course) => {
    const { data, error } = await supabase.rpc('upsert_course_fs', {
      p_course_code: course.code,
      p_course_name: course.name,
      p_department: course.department,
      p_semester: course.semester,
      p_academic_year: course.academic_year,
      p_faculty_id: course.faculty_id || null,
      p_id: course.id || null
    });
    if (error) throw error;
    return data;
  },

  deleteCourse: async (courseId) => {
    const { data, error } = await supabase.rpc('delete_course_fs', { p_course_id: courseId });
    if (error) throw error;
    return data;
  },

  /**
   * Run System Backup
   */
  getSystemHealth: async () => {
    const { data, error } = await supabase.rpc('get_system_health_fs');
    if (error) throw error;
    return data;
  },

  runBackup: async () => {
    const { data, error } = await supabase.rpc('backup_system_data_fs');
    if (error) throw error;

    // Create JSON Blob
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    saveAs(blob, `ISAMS_System_Backup_${new Date().toISOString().slice(0, 10)}.json`);

    return { success: true, message: "Backup downloaded successfully." };
  },

  restoreSystem: async (jsonData) => {
    const { data, error } = await supabase.rpc('restore_system_data_fs', { p_data: jsonData });
    if (error) throw error;
    return { success: true, message: data };
  },

  /**
   * Holiday Management
   */
  getHolidays: async () => {
    const { data, error } = await supabase.rpc('get_holidays_fs');
    if (error) throw error;
    return data;
  },

  upsertHoliday: async (holiday) => {
    const { error } = await supabase.rpc('upsert_holiday_fs', {
      p_date: holiday.date,
      p_description: holiday.description,
      p_recurring: holiday.is_recurring,
      p_id: holiday.id || null
    });
    if (error) throw error;
  },

  deleteHoliday: async (holidayId) => {
    const { error } = await supabase.rpc('delete_holiday_fs', { p_id: holidayId });
    if (error) throw error;
  },

  /**
   * DANGER ZONE: Reset Semester
   */
  resetSemester: async (semester, year) => {
    const { data, error } = await supabase.rpc('reset_semester_fs', {
      p_target_semester: semester,
      p_target_year: year
    });
    if (error) throw error;
    return data;
  },

  /**
   * DANGER ZONE: Purge Old Archives
   */
  purgeArchives: async (yearsToKeep = 5) => {
    const { data, error } = await supabase.rpc('purge_old_archives_fs', {
      p_retention_years: yearsToKeep
    });
    if (error) throw error;
    return data;
  },

  /**
   * DANGER ZONE: Approve All Pending (Clear Queue)
   */
  approveAllPending: async () => {
    const { data, error } = await supabase.rpc('approve_all_submissions_fs');
    if (error) throw error;
    return data;
  }
};