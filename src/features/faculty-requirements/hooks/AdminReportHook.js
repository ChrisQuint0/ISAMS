import { useState, useEffect, useCallback } from 'react';
import { reportService } from '../services/AdminReportService';
import { supabase } from '@/lib/supabaseClient';

export function useAdminReports() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState(null);

  const [recentExports, setRecentExports] = useState([]);
  const [options, setOptions] = useState({ semesters: [], academic_years: [] });

  const loadOptions = useCallback(async () => {
    try {
      const { data: courses } = await supabase
        .from('courses_fs')
        .select('semester, academic_year');

      const { data: deadlines } = await supabase
        .from('deadlines_fs')
        .select('semester, academic_year, is_active');

      if (courses) {
        const sems = [...new Set(courses.map(c => c.semester))].filter(Boolean).sort();
        const years = [...new Set(courses.map(c => c.academic_year))].filter(Boolean).sort().reverse();
        
        const periodsMap = new Map();
        deadlines?.forEach(d => {
           const key = `${d.academic_year}|${d.semester}`;
           if (d.is_active) periodsMap.set(key, 'Active');
           else if (!periodsMap.has(key)) periodsMap.set(key, 'Inactive');
        });
        
        const semesterPeriods = Array.from(periodsMap.entries()).map(([key, status]) => {
           const [ay, sem] = key.split('|');
           return { academic_year: ay, semester: sem, status };
        });

        setOptions({ semesters: sems, academic_years: years, semesterPeriods });
      }
    } catch (err) {
      console.error('Failed to load filter options:', err);
    }
  }, []);

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

  const reExportReport = async (exportRecord) => {
    setLoading(true);
    try {
      const config = {
        reportType: exportRecord.report_name, // Based on logExport call in exportCSV
        semester: exportRecord.semester,
        academicYear: exportRecord.academic_year
      };
      const data = await reportService.generateReport(config);
      if (data) {
        reportService.exportCSV(data);
        if (addToast) {
          addToast({ title: "Download Success", description: `Re-exported ${exportRecord.report_name}`, variant: "success" });
        }
      }
    } catch (err) {
      console.error('Re-export failed:', err);
      if (addToast) {
        addToast({ title: "Download Error", description: "Failed to re-generate historical report.", variant: "destructive" });
      }
    } finally {
      setLoading(false);
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
    loadOptions();
  }, [loadOptions]);

  return {
    loading,
    error,
    reportData,
    settings,
    recentExports,
    options,
    generateReport,
    exportCSV,
    reExportReport
  };
}