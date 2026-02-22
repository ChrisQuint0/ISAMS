import { useState, useEffect, useCallback } from 'react';
import { settingsService } from '../services/AdminSettingService';

export function useAdminSettings() {
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [settings, setSettings] = useState({});
  const [queue, setQueue] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [courseList, setCourseList] = useState([]);
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
    if (!window.confirm("Delete this requirement?")) return;
    setLoading(true);
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

  // --- Template Handlers ---
  const addTemplate = async (file) => {
    if (!file) return;
    setLoading(true);
    try {
      // Defaulting category to 'General' as UI input is currently file-only
      await settingsService.addTemplate(file, 'General', '');
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
    if (!window.confirm("Are you sure you want to delete this template?")) return;
    setLoading(true);
    try {
      await settingsService.deleteTemplate(id);
      setTemplates(prev => prev.filter(item => item.id !== id));
      setSuccess("Template deleted.");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Failed to delete template: " + err.message);
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  // --- Faculty Handlers ---
  const handleAddFaculty = async (facultyData) => {
    setLoading(true);
    try {
      const newFaculty = await settingsService.addFaculty(facultyData);
      setFacultyList(prev => [...prev, newFaculty]);
      setSuccess("Faculty added successfully.");
      setTimeout(() => setSuccess(null), 3000);
      return true;
    } catch (err) {
      setError("Failed to add faculty: " + err.message);
      setTimeout(() => setError(null), 3000);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFacultyStatus = async (id, currentStatus) => {
    // Optimistic update
    setFacultyList(prev => prev.map(f => f.faculty_id === id ? { ...f, is_active: !currentStatus } : f));
    try {
      await settingsService.updateFacultyStatus(id, !currentStatus);
    } catch (err) {
      setError("Failed to update status.");
      setTimeout(() => setError(null), 3000);
      // Revert
      setFacultyList(prev => prev.map(f => f.faculty_id === id ? { ...f, is_active: currentStatus } : f));
    }
  };

  // --- Course Handlers ---
  const handleAddCourse = async (courseData) => {
    setLoading(true);
    try {
      await settingsService.upsertCourse(courseData);
      setSuccess("Course saved successfully.");
      setTimeout(() => setSuccess(null), 3000);
      fetchData(); // Refresh list to get new ID/Data
      return true;
    } catch (err) {
      setError("Failed to save course: " + err.message);
      setTimeout(() => setError(null), 3000);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm("Are you sure you want to delete this course?")) return;
    setLoading(true);
    try {
      await settingsService.deleteCourse(courseId);
      setCourseList(prev => prev.filter(c => c.course_id !== courseId));
      setSuccess("Course deleted.");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Failed to delete course: " + err.message);
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

  const handleDeleteHoliday = async (id) => {
    if (!window.confirm("Delete this holiday?")) return;
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
      const queuePromise = settingsService.getQueue().catch(e => { console.error("Failed: queue", e); throw e; });
      const docsPromise = settingsService.getDocTypes().catch(e => { console.error("Failed: docs", e); throw e; });
      const facultyPromise = settingsService.getFaculty().catch(e => { console.error("Failed: faculty", e); throw e; });
      const healthPromise = settingsService.getSystemHealth().catch(e => { console.error("Failed: health", e); throw e; });

      const [allSettings, jobs, docs, temps, faculty, courses, health, holidayList, unassigned] = await Promise.all([
        settingsPromise,
        queuePromise,
        docsPromise,
        settingsService.getTemplates(),
        facultyPromise,
        settingsService.getCourses(),
        healthPromise,
        settingsService.getHolidays(),
        settingsService.getUnassignedSystemFaculty()
      ]);

      // ... rest of your code ...

      setSettings(allSettings);
      setQueue(jobs);
      setFacultyList(faculty.sort((a, b) => a.last_name.localeCompare(b.last_name)));
      setCourseList(courses || []);
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
        size: t.file_size_bytes ? `${(t.file_size_bytes / 1024 / 1024).toFixed(1)} MB` : 'Unknown',
        updated: new Date(t.created_at).toLocaleDateString()
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

  const runTestOCR = async (file) => {
    setProcessing(true);
    setTestResult(null);
    try {
      const result = await settingsService.runOCR(file, settings.ocr_language);
      setTestResult(result);
    } catch (err) {
      setError("Test failed: " + err.message);
      setTimeout(() => setError(null), 3000);
    } finally {
      setProcessing(false);
    }
  };

  const processQueue = async () => {
    setProcessing(true);
    let processedCount = 0;

    try {
      for (const job of queue) {
        if (!job.file_url) {
          // Handle missing URL gracefully
          await settingsService.completeJob(job.job_id, job.submission_id, null, false, "No download link");
          continue;
        }

        const result = await settingsService.runOCR(job.file_url, settings.ocr_language);

        await settingsService.completeJob(
          job.job_id,
          job.submission_id,
          result.text,
          result.success,
          result.error
        );
        processedCount++;
      }
      setSuccess(`Processed ${processedCount} jobs.`);
      fetchData(); // Refresh queue
    } catch (err) {
      setError("Queue processing interrupted.");
      setTimeout(() => setError(null), 3000);
    } finally {
      setProcessing(false);
    }
  };

  const runBackup = async () => {
    setProcessing(true);
    try {
      const result = await settingsService.runBackup();
      if (result.success) {
        setSuccess(result.message);
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      setError("Backup failed: " + err.message);
      setTimeout(() => setError(null), 3000);
    } finally {
      setProcessing(false);
    }
  };

  const restoreSystem = async (file) => {
    if (!file) return;
    setProcessing(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const json = JSON.parse(e.target.result);
        const result = await settingsService.restoreSystem(json);
        if (result.success) {
          setSuccess("System restored successfully. Reloading...");
          setTimeout(() => window.location.reload(), 2000);
        }
      } catch (err) {
        setError("Restore failed: " + err.message);
        setTimeout(() => setError(null), 3000);
      } finally {
        setProcessing(false);
      }
    };
    reader.readAsText(file);
  };

  return {
    loading, processing, error, success,
    settings, queue, testResult,
    updateSetting, saveGroup,
    docRequirements, addDocRequirement, updateDocRequirement, deleteDocRequirement,
    templates, addTemplate, deleteTemplate,
    facultyList, handleAddFaculty, handleToggleFacultyStatus,
    courseList, handleAddCourse, handleDeleteCourse,
    runTestOCR, processQueue, runBackup, restoreSystem,
    systemHealth, holidays, handleAddHoliday, handleDeleteHoliday,
    availableSystemUsers,
    refresh: fetchData
  };
}