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

  // Document Requirements State
  const [docRequirements, setDocRequirements] = useState([
    { id: 1, name: 'Syllabus', folder: 'Syllabi_2024', is_active: true, required: true },
    { id: 2, name: 'Class Record', folder: 'Grades_2024', is_active: true, required: true },
    { id: 3, name: 'Exam Material', folder: 'Exams_2024', is_active: true, required: false }
  ]);

  // Templates State
  const [templates, setTemplates] = useState([
    { id: 1, name: 'Syllabus Template v2.docx', size: '2.4 MB', updated: '2 days ago' },
    { id: 2, name: 'Grading Sheet 2024.xlsx', size: '1.1 MB', updated: '1 week ago' }
  ]);

  // Test State
  const [testResult, setTestResult] = useState(null);

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
    } finally {
      setLoading(false);
    }
  };

  // --- Template Handlers ---
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
    } finally {
      setLoading(false);
    }
  };

  // Initial Load
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [allSettings, jobs, docs, temps, faculty, courses, health, holidayList] = await Promise.all([
        settingsService.getAllSettings(),
        settingsService.getQueue(),
        settingsService.getDocTypes(),
        settingsService.getTemplates(),
        settingsService.getFaculty(),
        settingsService.getCourses(),
        settingsService.getSystemHealth(),
        settingsService.getHolidays()
      ]);
      setSettings(allSettings);
      setQueue(jobs);
      setFacultyList(faculty.sort((a, b) => a.last_name.localeCompare(b.last_name)));
      setCourseList(courses || []);
      setSystemHealth(health);
      setHolidays(holidayList || []);

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
        id: t.id,
        name: t.name,
        size: t.file_size || 'Unknown',
        updated: new Date(t.created_at).toLocaleDateString()
      })));

    } catch (err) {
      console.error(err);
      setError("Failed to load settings.");
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
    refresh: fetchData
  };
}