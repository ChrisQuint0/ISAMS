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

    if (docType.id) {
      // It's an UPDATE - Do not include doc_type_id in the payload!
      const { data, error } = await supabase
        .from('documenttypes_fs')
        .update(payload)
        .eq('doc_type_id', docType.id)
        .select();

      if (error) throw error;
      return data;

    } else {
      // It's an INSERT
      const { data, error } = await supabase
        .from('documenttypes_fs')
        .insert(payload)
        .select();

      if (error) throw error;
      return data;
    }
  },

  /**
   * Delete Document Type
   */
  deleteDocType: async (id) => {
    const { error } = await supabase.from('documenttypes_fs').delete().eq('doc_type_id', id);
    if (error) throw error;
  },

  /**
   * Get Validation Rules for a specific Document Type
   */
  getDocTypeValidation: async (docTypeId) => {
    // 1. Get column rules from documenttypes_fs
    const { data: docType, error: docError } = await supabase
      .from('documenttypes_fs')
      .select('required_keywords, forbidden_keywords, allowed_extensions, max_file_size_mb')
      .eq('doc_type_id', docTypeId)
      .single();

    if (docError) throw docError;

    // 2. Get min_word_count from systemsettings_fs (workaround since it's missing from doc table)
    const { data: systemSetting, error: sysError } = await supabase
      .from('systemsettings_fs')
      .select('setting_value')
      .eq('setting_key', `min_word_count_${docTypeId}`)
      .maybeSingle();

    if (sysError && sysError.code !== 'PGRST116') throw sysError;

    return {
      required_keywords: docType.required_keywords || [],
      forbidden_keywords: docType.forbidden_keywords || [],
      allowed_extensions: docType.allowed_extensions || ['.pdf'],
      max_file_size_mb: docType.max_file_size_mb || 10,
      min_word_count: systemSetting?.setting_value ? parseInt(systemSetting.setting_value) : 0,
    };
  },

  /**
   * Update Validation Rules for a specific Document Type
   */
  updateDocTypeRules: async (docTypeId, rules) => {
    // 1. Update columns in documenttypes_fs
    const { error: docError } = await supabase
      .from('documenttypes_fs')
      .update({
        required_keywords: rules.required_keywords,
        forbidden_keywords: rules.forbidden_keywords,
        allowed_extensions: rules.allowed_extensions,
        max_file_size_mb: rules.max_file_size_mb,
      })
      .eq('doc_type_id', docTypeId);

    if (docError) throw docError;

    // 2. Upsert min_word_count to systemsettings_fs via RPC
    const { error: sysError } = await supabase.rpc('upsert_setting_fs', {
      p_key: `min_word_count_${docTypeId}`,
      p_value: String(rules.min_word_count || 0)
    });

    if (sysError) throw sysError;
  },

  /**
   * Get Templates
   */
  getTemplates: async () => {
    const { data, error } = await supabase
      .from('templates_fs')
      .select('*')
      .order('academic_year', { ascending: false })
      .order('semester', { ascending: false })
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  addTemplate: async (file, title, description, systemCategory, academicYear, semester) => {
    // 1. Enforce active rule: archive existing templates in the same category
    if (systemCategory) {
      await supabase
        .from('templates_fs')
        .update({ is_active_default: false })
        .eq('system_category', systemCategory)
        .eq('is_active_default', true); // Only touch currently active ones
    }

    // 2. Upload to storage
    // Format GDrive-like path: Root > System Templates > AY > Sem > Category > fileName
    const safeYear = academicYear ? academicYear.replace(/\s+/g, '') : 'General';
    const safeSem = semester ? semester.replace(/\s+/g, '') : 'General';
    const safeCat = systemCategory ? systemCategory : 'General';
    const fileName = `templates/${safeYear}/${safeSem}/${safeCat}/${Date.now()}_${file.name}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('faculty_documents')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('faculty_documents')
      .getPublicUrl(fileName);

    // 3. Insert the new active template record
    const { data, error } = await supabase
      .from('templates_fs')
      .insert({
        title: title || file.name,
        description: description || '',
        system_category: systemCategory,
        academic_year: academicYear || null,
        semester: semester || null,
        file_url: publicUrl,
        file_size_bytes: file.size,
        is_active_default: true // Rule: New template becomes the active default
      })
      .select('*')
      .single();

    if (error) throw error;
    return data;
  },

  deleteTemplate: async (templateId) => {
    // Note: We could also delete from storage, but for now just DB record
    const { error } = await supabase.from('templates_fs').delete().eq('template_id', templateId);
    if (error) throw error;
  },

  archiveTemplate: async (templateId, isActive) => {
    const { error } = await supabase
      .from('templates_fs')
      .update({ is_active_default: isActive })
      .eq('template_id', templateId);
    if (error) throw error;
  },

  updateTemplateCoordinates: async (templateId, x, y) => {
    const { error } = await supabase
      .from('templates_fs')
      .update({ x_coord: x, y_coord: y })
      .eq('template_id', templateId);
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

  runOCR: async (fileUrlOrBlob, docTypeId) => {
    try {
      if (!docTypeId) {
        return { success: false, error: "Please select a Document Type from the left panel to test its validation rules against this file." };
      }

      if (!Array.isArray(fileUrlOrBlob)) {
        fileUrlOrBlob = [fileUrlOrBlob]; // Ensure it's an array
      }

      if (fileUrlOrBlob.length === 0 || !(fileUrlOrBlob[0] instanceof File)) {
        return { success: false, error: "Test Playground only supports uploading local files for testing." };
      }

      const formData = new FormData();
      fileUrlOrBlob.forEach(f => formData.append('files', f)); // Send all files as 'files'
      formData.append('doc_type_id', docTypeId);

      const startTime = performance.now();

      let { data, error } = await supabase.functions.invoke('document-parser', {
        body: formData,
      });

      const endTimeEdge = performance.now();

      if (error) {
        console.error("Edge Function Invocation Error:", error);
        return { success: false, error: error.message || "Failed to invoke the parser." };
      }

      // --- Split-Load Architecture Fallback ---
      // If the Edge function says it's an image, we call our local server for private OCR
      if (data && data.needsServerOcr) {
        console.log("[OCR] Image detected. Falling back to local Express server...");
        try {
          const fallbackRes = await fetch("http://localhost:3000/api/validate-image", {
            method: "POST",
            body: formData,
          });

          if (!fallbackRes.ok) {
            const errorBody = await fallbackRes.text();
            throw new Error(`Server returned ${fallbackRes.status}: ${errorBody}`);
          }

          const fallbackData = await fallbackRes.json();
          data = fallbackData;
          console.log("[OCR] Local fallback successful.");
        } catch (fallbackError) {
          console.error("Local Fallback Error Detail:", fallbackError);
          const detail = fallbackError.message || JSON.stringify(fallbackError);
          return { success: false, error: `Local OCR validation failed: ${detail}. Please ensure your Express server is running on port 3000.` };
        }
      }

      const endTime = performance.now();

      // The Edge function (or local fallback) returns { pass, extractedLength, wordCount, missingKeywords, foundForbidden, analyzedExtension, error? }
      if (data.error && data.pass === false) {
        return { success: false, error: data.error };
      }

      let resultText = `--- Edge Function Analysis ---\nFile Runtime: ${Math.round(endTime - startTime)}ms\nExtracted Length: ${data.extractedLength} chars\nWord Count: ${data.wordCount}\nAnalyzed Extension: ${data.analyzedExtension}\n\n`;

      resultText += `--- Validation Verdict: ${data.pass ? '✅ PASS' : '❌ FAIL'} ---\n`;

      if (data.missingKeywords && data.missingKeywords.length > 0) {
        resultText += `\nMissing Required Keywords:\n- ${data.missingKeywords.join('\n- ')}`;
      }

      if (data.foundForbidden && data.foundForbidden.length > 0) {
        resultText += `\n\nFound Forbidden Keywords:\n- ${data.foundForbidden.join('\n- ')}`;
      }

      if (data.pass) {
        resultText += `\n\nNo validation errors found. The document meets the strict requirements.`;
      }

      return {
        text: resultText,
        confidence: 100, // Edge function extraction doesn't rely on confidence heuristics like vision ML
        processing_time_ms: Math.round(endTime - startTime),
        success: data.pass
      };
    } catch (err) {
      console.error("OCR Failed:", err);
      return { success: false, error: err.message || "Unknown extraction error." };
    }
  },

  getUnassignedSystemFaculty: async () => {
    const { data, error } = await supabase.rpc('get_unassigned_system_faculty');
    if (error) throw error;
    return data || [];
  },

  /**
   * --- Faculty Management ---
   */
  getFaculty: async () => {
    // Use the purpose-built RPC that joins auth.users + user_rbac + faculty_fs
    const { data, error } = await supabase.rpc('get_faculty_management_fs');
    if (error) throw error;
    return data || [];
  },

  getFacultyById: async (facultyId) => {
    const { data, error } = await supabase
      .from('faculty_fs')
      .select('*')
      .eq('faculty_id', facultyId)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  // Update faculty editable fields via upsert RPC (identifies by user_id UUID)
  updateFacultyManagement: async (userId, field, value) => {
    const payload = { p_user_id: userId };
    if (field === 'emp_id') payload.p_emp_id = value;
    if (field === 'employment_type') payload.p_employment_type = value;
    if (field === 'is_active') payload.p_is_active = value;
    const { error } = await supabase.rpc('upsert_faculty_management_fs', payload);
    if (error) throw error;
  },

  /**
   * --- Course Catalog (master) ---
   */
  getMasterCourses: async () => {
    const { data, error } = await supabase.rpc('get_master_courses_fs');
    if (error) throw error;
    return data || [];
  },

  upsertMasterCourse: async (courseCode, courseName, semester, id = null, isActive = null) => {
    const { data, error } = await supabase.rpc('upsert_master_course_fs', {
      p_course_code: courseCode,
      p_course_name: courseName,
      p_semester: semester,
      p_id: id || null,
      p_is_active: isActive
    });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return data;
  },

  deleteMasterCourse: async (id) => {
    const { data, error } = await supabase.rpc('delete_master_course_fs', { p_id: id });
    if (error) throw error;
    return data;
  },

  /**
   * --- Course Assignments (sections) ---
   */
  getCourses: async () => {
    const { data, error } = await supabase.rpc('get_admin_courses_fs');
    if (error) throw error;
    return data;
  },

  // Add an assignment — now uses master_course_id so semester/code/name are auto-resolved
  upsertCourse: async (course) => {
    const { data, error } = await supabase.rpc('upsert_course_fs', {
      p_master_course_id: course.master_course_id,
      p_faculty_id: course.faculty_id || null,
      p_section: course.section || null,
      p_id: course.id || null,
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


  /**
   * Holiday Management
   */
  getHolidays: async () => {
    const { data, error } = await supabase.rpc('get_holidays_fs');
    if (error) throw error;
    return data;
  },

  upsertHoliday: async (holiday) => {
    const { data, error } = await supabase.rpc('upsert_holiday_fs', {
      p_date: holiday.date,
      p_description: holiday.description,
      p_id: holiday.id || null
    });
    if (error) throw error;
    if (data && data.success === false) throw new Error(data.message || "Failed to upsert holiday.");
  },

  deleteHoliday: async (holidayId) => {
    const { data, error } = await supabase.rpc('delete_holiday_fs', { p_id: holidayId });
    if (error) throw error;
    if (data && data.success === false) throw new Error(data.message || "Failed to delete holiday");
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
  }
};