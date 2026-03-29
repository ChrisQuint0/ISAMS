import { useState, useEffect, useCallback } from 'react';
import { FacultyArchiveService } from '../services/FacultyArchiveService';

export function useFacultyArchive() {
  const [courseList, setCourseList] = useState([]);
  const [history, setHistory] = useState([]);
  const [submissionVersions, setSubmissionVersions] = useState([]);
  const [options, setOptions] = useState({ semesters: [], academic_years: [], semesterPeriods: [], currentSemester: null, currentAcademicYear: null });
  
  const [loading, setLoading] = useState(false);
  const [downloadingCourseId, setDownloadingCourseId] = useState(null);
  const [downloadingBulk, setDownloadingBulk] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Helper to trigger temporary states for toasts
  const triggerError = (msg) => {
    setError(msg);
    setTimeout(() => setError(null), 3500);
  };

  const triggerSuccess = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3500);
  };

  // Initialize options once
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const data = await FacultyArchiveService.getOptions();
        setOptions(data);
      } catch (err) {
        console.error("Failed to load archive options", err);
      }
    };
    fetchOptions();
  }, []);

  const loadArchivedCourses = useCallback(async (semester, year) => {
    setLoading(true);
    setError(null);
    try {
      const data = await FacultyArchiveService.getArchivedCourses(semester, year);
      setCourseList(data || []);
      // Reset expanded states whenever filters change
      setHistory([]); 
    } catch (err) {
      triggerError('Failed to load archived courses.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCourseHistory = async (courseId) => {
    setLoading(true);
    try {
      const data = await FacultyArchiveService.getCourseHistory(courseId);
      setHistory(data || []);
    } catch (err) {
      console.error("Error loading course history", err);
    } finally {
      setLoading(false);
    }
  };

  const loadSubmissionVersions = async (submissionId) => {
    try {
      const data = await FacultyArchiveService.getSubmissionVersions(submissionId);
      setSubmissionVersions(data || []);
    } catch (err) {
      console.error("Error loading submission versions", err);
    }
  };

  const handleDownloadAll = async (course, semester, year) => {
    setDownloadingCourseId(course.course_id);
    try {
      const result = await FacultyArchiveService.downloadArchiveZip(course, semester, year);
      if (!result.success) {
        triggerError(result.message);
      } else {
        triggerSuccess(result.message);
      }
    } catch (err) {
      console.error("Download failed", err);
      triggerError("Failed to download ZIP archive. Check console for details.");
    } finally {
      setDownloadingCourseId(null);
    }
  };

  const handleDownloadBulk = async (semester, year) => {
    if (!courseList || courseList.length === 0) return;
    setDownloadingBulk(true);
    try {
      const result = await FacultyArchiveService.downloadBulkArchiveZip(courseList, semester, year);
      if (!result.success) {
        triggerError(result.message);
      } else {
        triggerSuccess(result.message);
      }
    } catch (err) {
      console.error("Bulk download failed", err);
      triggerError("Failed to download bulk ZIP archive. Check console for details.");
    } finally {
      setDownloadingBulk(false);
    }
  };

  return {
    courseList,
    history,
    submissionVersions,
    loading,
    error,
    success,
    downloadingCourseId,
    downloadingBulk,
    options,
    loadArchivedCourses,
    loadCourseHistory,
    loadSubmissionVersions,
    handleDownloadAll,
    handleDownloadBulk
  };
}
