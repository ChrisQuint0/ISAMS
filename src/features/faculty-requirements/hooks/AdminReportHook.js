import { useState, useEffect } from 'react';
import { reportService } from '../services/AdminReportService';
import { supabase } from '@/lib/supabaseClient';

export function useAdminReports() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState(null);

  const [recentExports, setRecentExports] = useState([]);

  const loadExports = async () => {
    const exports = await reportService.getRecentExports();
    setRecentExports(exports);
  };

  const generateReport = async (config) => {
    setLoading(true);
    setError(null);
    try {
      const data = await reportService.generateReport(config);
      setReportData(data);
    } catch (err) {
      console.error(err);
      setError("Failed to generate report.");
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = async (data = null, config = null) => {
    const dataToExport = data || reportData;
    if (dataToExport) {
      reportService.exportCSV(dataToExport);
      if (config) {
        await reportService.logExport(config.reportType, 'CSV', config.semester, config.academicYear);
        loadExports();
      }
    }
  };

  // System Settings
  const [settings, setSettings] = useState({ semester: '', academic_year: '' });

  useEffect(() => {
    const loadSettings = async () => {
      const { data } = await supabase.from('systemsettings_fs')
        .select('setting_key, setting_value')
        .in('setting_key', ['current_semester', 'current_academic_year']);

      const newSettings = {};
      data?.forEach(s => {
        if (s.setting_key === 'current_semester') newSettings.semester = s.setting_value;
        if (s.setting_key === 'current_academic_year') newSettings.academic_year = s.setting_value;
      });
      setSettings(prev => ({ ...prev, ...newSettings }));
    };
    loadSettings();
    loadExports();
  }, []);

  return {
    loading,
    error,
    reportData,
    settings,
    recentExports,
    generateReport,
    exportCSV
  };
}