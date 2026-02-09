import { useState } from 'react';
import { reportService } from '../services/AdminReportService';

export function useAdminReports() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState(null);

  const generateReport = async (config) => {
    setLoading(true);
    setError(null);
    try {
      const data = await reportService.generateReport(config);
      setReportData(data);
    } catch (err) {
      console.error(err);
      setError("Failed to generate report.");
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    if (reportData) {
      reportService.exportCSV(reportData);
    }
  };

  return {
    loading,
    error,
    reportData,
    generateReport,
    exportCSV
  };
}