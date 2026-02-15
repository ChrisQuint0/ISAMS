import { Route } from "react-router-dom";
import StudViolationLayout from "@/features/student-violations/pages/StudViolationLayout";
import StudViolationDashboard from "@/features/student-violations/pages/StudViolationDashboard";
import StudRecords from "@/features/student-violations/pages/StudRecords";
import StudViolations from "@/features/student-violations/pages/StudViolations";
import GenerateReport from "@/features/student-violations/pages/GenerateReport";
import Analytics from "@/features/student-violations/pages/Analytics";

export const StudViolationAppRoutes = (
  <Route element={<StudViolationLayout />}>
    <Route
      path="/student-violations"
      element={<StudViolationDashboard />}
    />
    <Route path="/students" element={<StudRecords />} />
    <Route path="/violations" element={<StudViolations />} />
    <Route path="/generate-report" element={<GenerateReport />} />
    <Route path="/analytics" element={<Analytics />} />
  </Route>
);