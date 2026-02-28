import { useState, useEffect, useCallback } from 'react';
import { settingsService } from '../services/AdminSettingService';
import { supabase } from '@/lib/supabaseClient';

export function useAdminSettings() {
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [settings, setSettings] = useState({});
  const [facultyList, setFacultyList] = useState([]);
  const [courseList, setCourseList] = useState([]);
  const [masterCourseList, setMasterCourseList] = useState([]);
  const [systemHealth, setSystemHealth] = useState(null);
  const [holidays, setHolidays] = useState([]);
  const [docRequirements, setDocRequirements] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [testResult, setTestResult] = useState(null);
  const [availableSystemUsers, setAvailableSystemUsers] = useState([]);

  // --- Document Requirement Handlers ---
  const addDocRequirement = async (req) => {
    setLoading(true);
    try {
      // Enforcement: Check for existing name or folder (case-insensitive)
      const isDuplicateName = docRequirements.some(d => d.name.toLowerCase().trim() === req.name.toLowerCase().trim());
      const isDuplicateFolder = docRequirements.some(d => d.folder.toLowerCase().trim() === req.folder.toLowerCase().trim());

      if (isDuplicateName) {
        throw new Error(`A requirement with the name "${req.name}" already exists.`);
      }
      if (isDuplicateFolder) {
        throw new Error(`The folder name "/${req.folder}" is already in use by another requirement.`);
      }

      await settingsService.upsertDocType({
        name: req.name,
        folder: req.folder,
        is_active: true,
        required: req.required
      });
      await fetchData();
      setSuccess("Requirement added.");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Failed to add requirement: " + err.message);
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const updateDocRequirement = async (id, updates) => {
    // 1. Find the item
    const item = docRequirements.find(d => d.id === id);
    if (!item) return;

    // 2. Optimistic Update
    setDocRequirements(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));

    // 3. Persist
    try {
      await settingsService.upsertDocType({ ...item, ...updates });
    } catch (err) {
      setError("Failed to update requirement.");
      setTimeout(() => setError(null), 3000);
      // Revert
      setDocRequirements(prev => prev.map(d => d.id === id ? item : d));
    }
  };

  const deleteDocRequirement = async (id) => {
    try {
      await settingsService.deleteDocType(id);
      setDocRequirements(prev => prev.filter(item => item.id !== id));
      setSuccess("Requirement deleted.");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Failed to delete: " + err.message);
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const fetchDocTypeRules = async (docTypeId) => {
    try {
      return await settingsService.getDocTypeValidation(docTypeId);
    } catch (err) {
      setError("Failed to fetch validation rules.");
      setTimeout(() => setError(null), 3000);
      return null;
    }
  };

  const saveDocTypeRules = async (docTypeId, rules) => {
    setLoading(true);
    try {
      await settingsService.updateDocTypeRules(docTypeId, rules);
      setSuccess("Validation rules updated.");
      setTimeout(() => setSuccess(null), 3000);
      return true;
    } catch (err) {
      setError("Failed to update validation rules.");
      setTimeout(() => setError(null), 3000);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // --- Template Handlers ---
  const addTemplate = async (file, title, description, systemCategory, academicYear, semester) => {
    if (!file) return;
    setLoading(true);
    try {
      await settingsService.addTemplate(file, title, description, systemCategory, academicYear, semester);
      await fetchData(); // Refresh list
      setSuccess("Template uploaded successfully.");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Failed to upload template: " + err.message);
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const deleteTemplate = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this template?")) return;
    setLoading(true);
    try {
      await settingsService.deleteTemplate(id);
      await fetchData();
      setSuccess("Template deleted.");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Failed to delete template: " + err.message);
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const archiveTemplate = async (id, isActive) => {
    setLoading(true);
    try {
      await settingsService.archiveTemplate(id, isActive);
      await fetchData();
      setSuccess(`Template ${isActive ? 'restored' : 'archived'}.`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Failed to archive template: " + err.message);
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const updateTemplateCoordinates = async (id, x, y) => {
    try {
      await settingsService.updateTemplateCoordinates(id, x, y);
      await fetchData();
      return true;
    } catch (err) {
      setError("Failed to save coordinates: " + err.message);
      setTimeout(() => setError(null), 3000);
      return false;
    }
  };

  const handleUpdateFacultyField = async (facultyId, field, value, oldValue) => {
    // 1. Find the original row (for user_id lookup only).
    //    NOTE: Do NOT use original[field] for "nothing changed" guard — AG Grid's valueSetter
    //    mutates params.data in-place before this runs, making original[field] === value always true.
    //    We use oldValue from the AG Grid event instead.
    const original = facultyList.find(f => f.faculty_id === facultyId);
    if (!original) return;
    if (oldValue === value) return; // skip if truly no change

    if (!original.user_id) {
      setError('Cannot update: this faculty record has no linked auth user.');
      setTimeout(() => setError(null), 4000);
      return;
    }

    // 2. Optimistic update: create a NEW object via spread so AG Grid gets a fresh reference.
    //    This is safe because it doesn't call fetchData() which would overwrite OTHER rows'
    //    in-progress edits — the root cause of the "value bleeds to next row" race condition.
    setFacultyList(prev => prev.map(f =>
      f.faculty_id === facultyId ? { ...f, [field]: value } : f
    ));

    // 3. Persist via RPC
    try {
      await settingsService.updateFacultyManagement(original.user_id, field, value);
      setSuccess('✓ Saved');
      setTimeout(() => setSuccess(null), 1500);
      // No fetchData() here — avoids overwriting adjacent rows' pending edits
    } catch (err) {
      console.error('updateFacultyManagement failed:', { facultyId, field, value, err });
      setError('Failed to update: ' + err.message);
      setTimeout(() => setError(null), 4000);
      await fetchData(); // Refetch only on error to revert the optimistic update
    }
  };

  // --- Course Catalog Handlers ---
  const handleAddMasterCourse = async (code, name, semester) => {
    try {
      await settingsService.upsertMasterCourse(code, name, semester);
      const fresh = await settingsService.getMasterCourses();
      setMasterCourseList(fresh);
      setSuccess('Course added to catalog.');
      setTimeout(() => setSuccess(null), 3000);
      return true;
    } catch (err) {
      setError('Failed to add catalog course: ' + err.message);
      setTimeout(() => setError(null), 3000);
      return false;
    }
  };

  const handleDeleteMasterCourse = async (id) => {
    try {
      await settingsService.deleteMasterCourse(id);
      setMasterCourseList(prev => prev.filter(c => c.id !== id));
      setSuccess('Catalog entry removed.');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to remove catalog entry: ' + err.message);
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleUpdateMasterCourseField = async (courseId, field, value, oldValue) => {
    const original = masterCourseList.find(c => c.id === courseId);
    if (!original) return;
    if (oldValue === value) return;

    // Optimistic Update for master list
    setMasterCourseList(prev => prev.map(c =>
      c.id === courseId ? { ...c, [field]: value } : c
    ));

    // Real-time synchronization for assignments list (courseList)
    setCourseList(prev => prev.map(c => {
      if (c.master_course_id === courseId) {
        // Map master field names to assignment property names
        if (field === 'is_active') return { ...c, master_is_active: value };
        if (field === 'course_name') return { ...c, course_name: value };
        if (field === 'course_code') return { ...c, course_code: value };
      }
      return c;
    }));

    try {
      // Use existing upsertMasterCourse RPC but only change what's needed
      // Note: upsert_master_course_fs(code, name, semester, id, is_active)
      await settingsService.upsertMasterCourse(
        field === 'course_code' ? value : original.course_code,
        field === 'course_name' ? value : original.course_name,
        field === 'semester' ? value : original.semester,
        courseId,
        field === 'is_active' ? value : original.is_active
      );
      setSuccess('✓ Saved');
      setTimeout(() => setSuccess(null), 1500);
    } catch (err) {
      setError('Failed to update catalog: ' + err.message);
      setTimeout(() => setError(null), 4000);
      const fresh = await settingsService.getMasterCourses();
      setMasterCourseList(fresh);
    }
  };

  // --- Course Assignment Handlers ---
  const handleAddCourse = async (courseData) => {
    setLoading(true);
    try {
      await settingsService.upsertCourse(courseData);
      setSuccess('Section assignment saved.');
      setTimeout(() => setSuccess(null), 3000);
      const fresh = await settingsService.getCourses();
      setCourseList(fresh || []);
      return true;
    } catch (err) {
      setError('Failed to save assignment: ' + err.message);
      setTimeout(() => setError(null), 3000);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCourse = async (courseId) => {
    setLoading(true);
    try {
      await settingsService.deleteCourse(courseId);
      setCourseList(prev => prev.filter(c => c.course_id !== courseId));
      setSuccess('Assignment removed.');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to delete assignment: ' + err.message);
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  // --- Holiday Handlers ---
  const handleAddHoliday = async (holiday) => {
    setLoading(true);
    try {
      await settingsService.upsertHoliday(holiday);
      await fetchData(); // Refresh list
      setSuccess("Holiday saved.");
      setTimeout(() => setSuccess(null), 3000);
      return true;
    } catch (err) {
      setError("Failed to save holiday: " + err.message);
      setTimeout(() => setError(null), 3000);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAddHolidays = async (startDate, endDate, description) => {
    setLoading(true);
    try {
      const start = new Date(startDate);
      const end = endDate ? new Date(endDate) : new Date(startDate);

      if (end < start) {
        throw new Error("End date cannot be before start date.");
      }

      // Check for occupied dates
      const occupiedDates = [];
      let checkDate = new Date(start);
      while (checkDate <= end) {
        const formatted = checkDate.toLocaleDateString('en-CA');
        if (holidays.some(h => (h.holiday_date || h.date) === formatted)) {
          occupiedDates.push(formatted);
        }
        checkDate.setDate(checkDate.getDate() + 1);
      }

      if (occupiedDates.length > 0) {
        throw new Error(`Occupied: ${occupiedDates.join(', ')}`);
      }

      const promises = [];
      let currentDate = new Date(start);

      while (currentDate <= end) {
        // Format as YYYY-MM-DD local time to avoid timezone drift
        const formattedDate = currentDate.toLocaleDateString('en-CA');

        promises.push(
          settingsService.upsertHoliday({
            date: formattedDate,
            description: description,
            id: null
          })
        );
        currentDate.setDate(currentDate.getDate() + 1);
      }

      await Promise.all(promises);
      await fetchData(); // Refresh list only once after all inserts
      setSuccess(`Successfully scheduled ${promises.length} holiday day(s).`);
      setTimeout(() => setSuccess(null), 3000);
      return true;
    } catch (err) {
      setError(err.message.includes("Occupied:") ? err.message : "Failed to save holidays: " + err.message);
      setTimeout(() => setError(null), 4000);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHoliday = async (id) => {
    setLoading(true);
    try {
      await settingsService.deleteHoliday(id);
      setHolidays(prev => prev.filter(h => h.holiday_id !== id));
      setSuccess("Holiday deleted.");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Failed to delete holiday: " + err.message);
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  // Initial Load
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // DEBUG: Log each call to see which one fails
      const settingsPromise = settingsService.getAllSettings().catch(e => { console.error("Failed: settings", e); throw e; });
      const docsPromise = settingsService.getDocTypes().catch(e => { console.error("Failed: docs", e); throw e; });
      const facultyPromise = settingsService.getFaculty().catch(e => { console.error("Failed: faculty", e); throw e; });
      const healthPromise = settingsService.getSystemHealth().catch(e => { console.error("Failed: health", e); throw e; });

      const [allSettings, docs, temps, faculty, courses, masterCourses, health, holidayList, unassigned] = await Promise.all([
        settingsPromise,
        docsPromise,
        settingsService.getTemplates(),
        facultyPromise,
        settingsService.getCourses(),
        settingsService.getMasterCourses(),
        healthPromise,
        settingsService.getHolidays(),
        settingsService.getUnassignedSystemFaculty()
      ]);

      // ... rest of your code ...

      setSettings(allSettings);
      setFacultyList(faculty.sort((a, b) => (a.last_name ?? '').localeCompare(b.last_name ?? '')));
      setCourseList(courses || []);
      setMasterCourseList(masterCourses || []);
      setSystemHealth(health);
      setHolidays(holidayList || []);
      setAvailableSystemUsers(unassigned || []);
      // Map DB Document Types to UI shape
      setDocRequirements(docs.map(d => ({
        id: d.doc_type_id,
        name: d.type_name,
        folder: d.description || 'General',
        is_active: d.is_active,
        required: d.required_by_default
      })));

      // Map DB Templates to UI shape
      setTemplates(temps.map(t => ({
        id: t.template_id,
        name: t.title,
        category: t.system_category || 'General',
        academicYear: t.academic_year || 'N/A',
        semester: t.semester || 'N/A',
        isActive: t.is_active_default,
        size: t.file_size_bytes ? `${(t.file_size_bytes / 1024 / 1024).toFixed(1)} MB` : 'Unknown',
        updated: new Date(t.created_at).toLocaleDateString(),
        x_coord: t.x_coord,
        y_coord: t.y_coord,
        file_url: t.file_url // For NameCalibratorModal rendering
      })));

    } catch (err) {
      console.error(err);
      setError("Failed to load settings.");
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Realtime: auto-refresh faculty list when user_rbac changes (e.g. permission granted in Global Dashboard)
  useEffect(() => {
    const channel = supabase
      .channel('admin-faculty-rbac-watch')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_rbac' }, () => {
        fetchData();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchData]);

  // Update a single setting immediately (for Switches/Toggles)
  const updateSetting = async (key, value) => {
    // Optimistic update
    setSettings(prev => ({ ...prev, [key]: value }));
    try {
      await settingsService.saveSetting(key, value);
    } catch (err) {
      setError("Failed to save setting.");
      setTimeout(() => setError(null), 3000);
      fetchData(); // Revert on error
    }
  };

  // NEW: Save a group of settings (For "Save" buttons)
  const saveGroup = async (settingsObj) => {
    setLoading(true);
    setSuccess(null);
    try {
      // Loop through object and save each key
      const promises = Object.entries(settingsObj).map(([key, value]) =>
        settingsService.saveSetting(key, value)
      );
      await Promise.all(promises);

      setSuccess("Settings saved successfully.");
      setTimeout(() => setSuccess(null), 3000);
      await fetchData(); // Refresh to be sure
    } catch (err) {
      setError("Failed to save settings group.");
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const runTestOCR = async (file, docTypeId) => {
    if (!settings.ocr_enabled) {
      setTestResult({ success: false, text: "Cant validate the file, Master Switch is Off", error: "Cant validate the file, Master Switch is Off" });
      return;
    }
    setProcessing(true);
    setTestResult(null);
    try {
      const result = await settingsService.runOCR(file, docTypeId);
      setTestResult(result);
    } catch (err) {
      setError("Test failed: " + err.message);
      setTimeout(() => setError(null), 3000);
    } finally {
      setProcessing(false);
    }
  };



  return {
    loading, processing, error, success, setError, setSuccess,
    settings, testResult,
    clearTestResult: () => setTestResult(null),
    updateSetting, saveGroup,
    docRequirements, addDocRequirement, updateDocRequirement, deleteDocRequirement,
    fetchDocTypeRules, saveDocTypeRules,
    templates, addTemplate, deleteTemplate, archiveTemplate, updateTemplateCoordinates,
    facultyList, handleUpdateFacultyField,
    masterCourseList, handleAddMasterCourse, handleDeleteMasterCourse, handleUpdateMasterCourseField,
    courseList, handleAddCourse, handleDeleteCourse,
    runTestOCR,
    systemHealth, holidays, handleAddHoliday, handleBulkAddHolidays, handleDeleteHoliday,
    availableSystemUsers,
    refresh: fetchData
  };
}