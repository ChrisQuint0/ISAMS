import { supabase } from "@/lib/supabaseClient";

export const reportService = {
  /**
   * Generate Report Preview
   */
  generateReport: async (config) => {
    const { data, error } = await supabase.rpc('generate_report_fs', {
      p_report_type: config.reportType,
      p_semester: config.semester,
      p_academic_year: config.academicYear,
      p_department: config.department === 'All Departments' ? null : config.department
    });

    if (error) throw error;

    // Transform Chart Data for Recharts/Chart.js
    let labels = [];
    let values = [];

    if (data.chart_data && data.chart_data.length > 0) {
      if (config.reportType === 'Submission Status') {
        labels = data.chart_data.map(d => d.submission_status);
        values = data.chart_data.map(d => d.count);
      } else if (config.reportType === 'Late Analysis') {
        labels = data.chart_data.map(d => d.department);
        values = data.chart_data.map(d => d.count);
      } else if (config.reportType === 'Clearance') {
        // Clearance chart returns a single object with cleared/pending counts
        const chartObj = data.chart_data[0];
        labels = ['Cleared', 'Pending'];
        values = [chartObj.cleared, chartObj.pending];
      }
    }

    const chartData = {
      labels: labels,
      datasets: [{
        label: 'Count',
        data: values,
        backgroundColor: ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6']
      }]
    };

    return { ...data, chartData };
  },

  /**
   * Export to CSV (Client-Side)
   */
  exportCSV: (reportData) => {
    if (!reportData.data_preview || reportData.data_preview.length === 0) return null;

    const headers = Object.keys(reportData.data_preview[0]);
    const csvRows = [
      headers.join(','), // Header Row
      ...reportData.data_preview.map(row =>
        headers.map(fieldName => {
          const val = row[fieldName] || '';
          return `"${String(val).replace(/"/g, '""')}"`; // Escape quotes
        }).join(',')
      )
    ];

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);

    // Trigger download
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportData.report_type.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    return true;
  }
};