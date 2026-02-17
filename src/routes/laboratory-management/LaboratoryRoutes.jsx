import React from 'react';
import { Route } from "react-router-dom";

// Imports for Laboratory Monitoring
import LabLayout from "@/features/lab-monitoring/layouts/LabLayout";
import LabSelectionPage from "@/features/lab-monitoring/pages/LabSelectionPage";
import LabDashboard from "@/features/lab-monitoring/pages/LabDashboard";
import AccessLogs from "@/features/lab-monitoring/pages/AccessLogs";
import LabSchedule from "@/features/lab-monitoring/pages/LabSchedule";
import PCManagement from "@/features/lab-monitoring/pages/PCManagement";
import ReportsAnalytics from "@/features/lab-monitoring/pages/ReportsAnalytics";
import AuditTrails from "@/features/lab-monitoring/pages/AuditTrails";
import LabSettings from "@/features/lab-monitoring/pages/LabSettings";
import Kiosk from "@/features/lab-monitoring/pages/Kiosk";
import Success from "@/features/lab-monitoring/pages/Success";

export const LaboratoryRoutes = (ProtectedRoute) => (
  <>
    {/* Lab Selection Page */}
    <Route
      path="/lab-monitoring"
      element={
        <ProtectedRoute>
          <LabSelectionPage />
        </ProtectedRoute>
      }
    />

    {/* Lab Layout Routes */}
    <Route
      element={
        <ProtectedRoute>
          <LabLayout />
        </ProtectedRoute>
      }
    >
      <Route path="/lab-dashboard" element={<LabDashboard />} />
      <Route path="/access-logs" element={<AccessLogs />} />
      <Route path="/lab-schedule" element={<LabSchedule />} />
      <Route path="/pc-management" element={<PCManagement />} />
      <Route path="/reports-analytics" element={<ReportsAnalytics />} />
      <Route path="/audit-trails" element={<AuditTrails />} />
      <Route path="/lab-settings" element={<LabSettings />} />
    </Route>

    {/* Kiosk Mode (Standalone) */}
    <Route
      path="/kiosk-mode"
      element={
        <ProtectedRoute>
          <Kiosk />
        </ProtectedRoute>
      }
    />
    <Route
      path="/success"
      element={
        <ProtectedRoute>
          <Success />
        </ProtectedRoute>
      }
    />
  </>
);