import { useState, useEffect, useCallback } from 'react';
import { settingsService } from '../services/AdminSettingService';

export function useAdminSettings() {
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const [settings, setSettings] = useState({});
  const [queue, setQueue] = useState([]);
  
  // Test State
  const [testResult, setTestResult] = useState(null);

  // Initial Load
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // FIX: Changed from getOcrSettings to getAllSettings
      const [allSettings, jobs] = await Promise.all([
        settingsService.getAllSettings(),
        settingsService.getQueue()
      ]);
      setSettings(allSettings);
      setQueue(jobs);
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

  return {
    loading, processing, error, success,
    settings, queue, testResult,
    updateSetting, saveGroup, // Exporting this is crucial for the new UI
    runTestOCR, processQueue, refresh: fetchData
  };
}