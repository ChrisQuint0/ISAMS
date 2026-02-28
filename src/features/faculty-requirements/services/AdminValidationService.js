import { supabase } from "@/lib/supabaseClient";

export const validationService = {
  /**
   * Fetch the pending queue (Submitted/Validated items)
   */
  getQueue: async (filters) => {
    // Determine status filter
    let statusFilter = null;
    if (filters.status === 'SUBMITTED') statusFilter = 'SUBMITTED';
    else if (filters.status === 'VALIDATED') statusFilter = 'VALIDATED';

    const { data, error } = await supabase.rpc('get_validation_queue_fs', {
      p_status: statusFilter,
      p_department: filters.department === 'All Departments' ? null : filters.department
    });

    if (error) throw error;
    return data;
  },

  /**
   * Fetch recently approved items (Matches Wireframe)
   */
  getRecentApprovals: async () => {
    const { data, error } = await supabase
      .from('submissions_fs')
      .select(`
        submission_id,
        original_filename,
        approved_at,
        doc_type:documenttypes_fs(type_name),
        faculty:faculty_fs(first_name, last_name)
      `)
      .eq('submission_status', 'APPROVED')
      .order('approved_at', { ascending: false })
      .limit(5);

    if (error) throw error;

    // Transform for UI
    return data.map(item => ({
      id: item.submission_id,
      filename: item.original_filename,
      type: item.doc_type?.type_name || 'Document',
      faculty: `${item.faculty?.first_name} ${item.faculty?.last_name}`,
      date: new Date(item.approved_at).toLocaleDateString()
    }));
  },

  /**
   * Get Validation Stats
   */
  getStats: async () => {
    const { data, error } = await supabase.rpc('get_validation_stats_fs');
    if (error) throw error;
    return data;
  },

  /**
   * Process Action (Approve/Reject)
   * If approving a staged file, move it to the official vault first.
   */
  processAction: async (submission, action, remarks) => {
    const submissionId = submission.submission_id || submission.id;

    if (action === 'APPROVE' && submission.is_staged) {
      console.log("[ValidationService] Moving staged file to vault...");
      try {
        // 1. Get Root Folder ID
        const { data: setting } = await supabase
          .from('systemsettings_fs')
          .select('setting_value')
          .eq('setting_key', 'gdrive_root_folder_id')
          .single();

        const rootFolderId = setting?.setting_value;
        if (!rootFolderId) throw new Error("Root Folder ID not configured in settings.");

        // 2. Ensure Target Folder Structure
        const { ensureFolderStructure } = await import('./gdriveSettings');
        const targetFolderId = await ensureFolderStructure(rootFolderId, {
          academicYear: submission.academic_year,
          semester: submission.semester,
          facultyName: submission.faculty_name,
          courseCode: submission.course_code,
          section: submission.section,
          docTypeName: submission.type_name,
        });

        // 3. Move File in GDrive
        const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';
        const moveRes = await fetch(`${API_BASE}/api/files/move`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileId: submission.gdrive_file_id,
            targetFolderId: targetFolderId
          })
        });

        if (!moveRes.ok) {
          const moveErr = await moveRes.json().catch(() => ({ error: "GDrive move failed" }));
          throw new Error(moveErr.error || "Failed to move file in Google Drive");
        }

        // 4. Update DB to mark as no longer staged
        await supabase
          .from('submissions_fs')
          .update({ is_staged: false })
          .eq('submission_id', submissionId);

      } catch (err) {
        console.error("[ValidationService] Move error:", err);
        throw new Error(`File move failed: ${err.message}. Data integrity prioritized; approval halted.`);
      }
    }

    if (action === 'REJECT' && submission.is_staged && submission.gdrive_file_id) {
      console.log("[ValidationService] Deleting rejected staged file from GDrive...");
      try {
        const { deleteGDriveFile } = await import('./gdriveSettings');
        await deleteGDriveFile(submission.gdrive_file_id);
      } catch (err) {
        console.error("[ValidationService] Delete error (non-blocking):", err);
        // We don't block DB update if delete fails (user might have deleted it already)
      }
    }

    const { data, error } = await supabase.rpc('process_validation_action_fs', {
      p_submission_id: submissionId,
      p_action: action,
      p_remarks: remarks
    });

    if (error) throw error;
    return data;
  },

  /**
   * Get Download Link
   */
  getDownloadLink: async (submissionId) => {
    const { data, error } = await supabase
      .from('submissions_fs')
      .select('storage_provider, gdrive_web_view_link, gdrive_download_link, gdrive_file_id')
      .eq('submission_id', submissionId)
      .single();

    if (error) throw error;

    if (data.storage_provider === 'GOOGLE_DRIVE') {
      return data.gdrive_download_link ||
        `https://drive.google.com/uc?export=download&id=${data.gdrive_file_id}`;
    }
    return null;
  },

  /**
   * Approve All Pending
   */
  approveAllPending: async (department) => {
    const { data, error } = await supabase.rpc('approve_all_pending_fs', {
      p_department: department === 'All Departments' ? null : department
    });

    if (error) throw error;
    return data;
  },

  runBotCheck: async (submissionId) => {
    const { data, error } = await supabase.rpc('run_bot_check_fs', {
      p_submission_id: submissionId
    });
    if (error) throw error;
    return { success: true, data };
  }
};