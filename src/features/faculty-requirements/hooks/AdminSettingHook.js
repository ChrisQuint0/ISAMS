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
  const addDocRequirement = (req) => {
    setDocRequirements(prev => [...prev, { ...req, id: Date.now(), is_active: true }]);
  };

  const updateDocRequirement = (id, updates) => {
    setDocRequirements(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const deleteDocRequirement = (id) => {
    setDocRequirements(prev => prev.filter(item => item.id !== id));
  };

  // --- Template Handlers ---
  const addTemplate = (file) => {
    // Mock upload
    setTemplates(prev => [...prev, {
      id: Date.now(),
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      updated: 'Just now'
    }]);
  };

  const deleteTemplate = (id) => {
    setTemplates(prev => prev.filter(item => item.id !== id));
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

  // Initial Load
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [allSettings, jobs, docs, temps, faculty] = await Promise.all([
        settingsService.getAllSettings(),
        settingsService.getQueue(),
        settingsService.getDocTypes(),
        settingsService.getTemplates(),
        settingsService.getFaculty(),
        settingsService.getCourses()
      ]);
      setSettings(allSettings);
      setQueue(jobs);
      setFacultyList(faculty.sort((a, b) => a.last_name.localeCompare(b.last_name)));
      setCourseList(courses || []);

      // Map DB Document Types to UI shape
      setDocRequirements(docs.map(d => ({
        id: d.id,
        name: d.type_name,
        folder: d.folder_name || 'General',
        is_active: d.is_active,
        required: d.is_required
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

  return {
    loading, processing, error, success,
    settings, queue, testResult,
    updateSetting, saveGroup,
    docRequirements, addDocRequirement, updateDocRequirement, deleteDocRequirement,
    templates, addTemplate, deleteTemplate,
    facultyList, handleAddFaculty, handleToggleFacultyStatus,
    courseList, handleAddCourse, handleDeleteCourse,
    runTestOCR, processQueue, runBackup, refresh: fetchData
  };
}