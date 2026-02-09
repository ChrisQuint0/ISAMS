import { supabase } from "@/lib/supabaseClient";

export const reportService = {
  /**
   * Generate Report Preview
   */
  generateReport: async (config) => {
    const { data, error } = await supabase.rpc('generate_report_fn', {
      p_report_type: config.reportType,
      p_semester: config.semester,
      p_academic_year: config.academicYear,
      p_department: config.department === 'All Departments' ? null : config.department
    });

    if (error) throw error;
    
    // Transform Chart Data for Recharts/Chart.js
    const chartData = {
      labels: data.chart_data?.map(d => d.label) || [],
      datasets: [{
        label: 'Count',
        data: data.chart_data?.map(d => d.value) || [],
        backgroundColor: ['#10b981', '#f59e0b', '#ef4444', '#3b82f6']
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
    a.download = `${reportData.report_type.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    return true;
  }
};