import { Route } from "react-router-dom";
// Import the new Layout
import AdminLayout from "@/features/student-violations/layout/AdminLayout";

// Import your page components
import StudViolationDashboard from "@/features/student-violations/pages/StudViolationDashboard";
import StudRecords from "@/features/student-violations/pages/StudRecords";
import StudViolations from "@/features/student-violations/pages/StudViolations";
import GenerateReport from "@/features/student-violations/pages/GenerateReport";
import Analytics from "@/features/student-violations/pages/Analytics";
import Settings from "@/features/student-violations/pages/Settings"; // Add this import
import ManageOffenses from "@/features/student-violations/pages/settings-pages/ManageOffenses";
import ManageSanctions from "@/features/student-violations/pages/settings-pages/ManageSanctions";

export const StudViolationAppRoutes = (
  /* The AdminLayout now wraps all these routes */
  <Route element={<AdminLayout />}>
    {/* Use 'index' or the specific path for the main dashboard */}
    <Route
      path="/student-violations"
      element={<StudViolationDashboard />}
    />

    {/* Other module pages that will now show the AdminSidebar */}
    <Route path="/students" element={<StudRecords />} />
    <Route path="/violations" element={<StudViolations />} />
    <Route path="/generate-report" element={<GenerateReport />} />
    <Route path="/analytics" element={<Analytics />} />
    <Route path="/violation-settings" element={<Settings />} />
    <Route path="/violation-settings/manage-offenses" element={<ManageOffenses />} />
    <Route path="/violation-settings/manage-sanctions" element={<ManageSanctions />} />
  </Route>
);