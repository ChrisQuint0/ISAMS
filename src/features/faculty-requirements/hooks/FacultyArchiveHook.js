import { useState, useEffect, useCallback, useRef } from 'react';
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

  const [downloadProgress, setDownloadProgress] = useState({ isOpen: false, bytes: 0, total: 0 });
  const abortControllerRef = useRef(null);

  const cancelDownload = () => {
    if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
    }
    setDownloadProgress({ isOpen: false, bytes: 0, total: 0 });
  };

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

  const loadSubmissionVersions = async (submissionId, filename = null) => {
    try {
      const data = await FacultyArchiveService.getSubmissionVersions(submissionId, filename);
      setSubmissionVersions(data || []);
    } catch (err) {
      console.error("Error loading submission versions", err);
    }
  };

  const handleDownloadAll = async (course, semester, year) => {
    setDownloadingCourseId(course.course_id);
    abortControllerRef.current = new AbortController();
    setDownloadProgress({ isOpen: true, bytes: 0, total: 0 });

    try {
      const result = await FacultyArchiveService.downloadArchiveZip(
        course, 
        semester, 
        year, 
        (prog) => setDownloadProgress(prev => ({ ...prev, bytes: prog.receivedBytes, total: prog.totalBytes })),
        abortControllerRef.current.signal
      );
      
      if (!result.success) {
        if (result.message.includes('aborted') || result.message.includes('The user aborted a request')) {
            triggerError("Download Canceled");
        } else {
            triggerError(result.message);
        }
      } else {
        triggerSuccess(result.message);
      }
    } catch (err) {
      console.error("Download failed", err);
      if (err.name === 'AbortError') {
          triggerError("Download Canceled");
      } else {
          triggerError("Failed to download ZIP archive. Check console for details.");
      }
    } finally {
      setDownloadingCourseId(null);
      setDownloadProgress({ isOpen: false, bytes: 0, total: 0 });
      abortControllerRef.current = null;
    }
  };

  const handleDownloadBulk = async (semester, year) => {
    if (!courseList || courseList.length === 0) return;
    setDownloadingBulk(true);
    abortControllerRef.current = new AbortController();
    setDownloadProgress({ isOpen: true, bytes: 0, total: 0 });

    try {
      const result = await FacultyArchiveService.downloadBulkArchiveZip(
          courseList, 
          semester, 
          year,
          (prog) => setDownloadProgress(prev => ({ ...prev, bytes: prog.receivedBytes, total: prog.totalBytes })),
          abortControllerRef.current.signal
      );
      if (!result.success) {
        if (result.message.includes('aborted') || result.message.includes('The user aborted a request')) {
            triggerError("Download Canceled");
        } else {
            triggerError(result.message);
        }
      } else {
        triggerSuccess(result.message);
      }
    } catch (err) {
      console.error("Bulk download failed", err);
      if (err.name === 'AbortError') {
          triggerError("Download Canceled");
      } else {
          triggerError("Failed to download bulk ZIP archive. Check console for details.");
      }
    } finally {
      setDownloadingBulk(false);
      setDownloadProgress({ isOpen: false, bytes: 0, total: 0 });
      abortControllerRef.current = null;
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
    handleDownloadBulk,
    downloadProgress,
    cancelDownload
  };
}
