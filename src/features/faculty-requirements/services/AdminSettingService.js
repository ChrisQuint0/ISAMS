import { supabase } from "@/lib/supabaseClient";
import Tesseract from 'tesseract.js';

export const settingsService = {
  /**
   * Get ALL System Settings (OCR, General, Validation)
   * Renamed from getOcrSettings to getAllSettings to reflect new scope
   */
  getAllSettings: async () => {
    // Fetch all settings from the table
    const { data, error } = await supabase
      .from('system_settings')
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
      val_allowed_extensions: settingsMap.val_allowed_extensions || '.pdf, .docx, .xlsx',
    };
  },

  /**
   * Get Document Types (Requirements)
   */
  getDocTypes: async () => {
    const { data, error } = await supabase
      .from('document_types')
      .select('*')
      .order('type_name');
    if (error) throw error;
    return data;
  },

  /**
   * Upsert Document Type
   */
  upsertDocType: async (docType) => {
    const { data, error } = await supabase
      .from('document_types')
      .upsert({
        id: docType.id, // If null, will create new
        type_name: docType.name || docType.type_name,
        // Map other fields as needed
        is_active: docType.is_active,
        is_required: docType.required
      })
      .select();
    if (error) throw error;
    return data;
  },

  /**
   * Delete Document Type
   */
  deleteDocType: async (id) => {
    const { error } = await supabase.from('document_types').delete().eq('id', id);
    if (error) throw error;
  },

  /**
   * Get Templates
   */
  getTemplates: async () => {
    const { data, error } = await supabase.from('templates').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  /**
   * Save a single setting (Generic)
   */
  saveSetting: async (key, value) => {
    const { error } = await supabase.rpc('upsert_setting_fn', {
      p_key: key,
      p_value: String(value)
    });
    if (error) throw error;
  },

  /**
   * OCR Queue & Processing (Existing Logic)
   */
  getQueue: async () => {
    const { data, error } = await supabase.rpc('get_pending_ocr_jobs_fn');
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
    await supabase.rpc('complete_ocr_job_fn', {
      p_job_id: jobId,
      p_submission_id: submissionId,
      p_text: text || '',
      p_status: success ? 'COMPLETED' : 'FAILED',
      p_error: errorMsg
    });
  }
};