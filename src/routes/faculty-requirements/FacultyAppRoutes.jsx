import { Route } from "react-router-dom";
import FacultyLayout from "@/features/faculty-requirements/layout/FacultyLayout";

// NOTE: Uncomment imports one by one as we create each page.
import FacultyDashboardPage from "@/features/faculty-requirements/pages/FacultyDashboardPage";
import FacultySubmissionPage from "@/features/faculty-requirements/pages/FacultySubmissionPage";
import FacultyAnalyticsPage from "@/features/faculty-requirements/pages/FacultyAnalyticsPage";
import FacultyArchivePage from "@/features/faculty-requirements/pages/FacultyArchivePage";
import FacultyTemplateHubPage from "@/features/faculty-requirements/pages/FacultyTemplateHubPage";

export const FacultyAppRoutes = (
  <Route element={<FacultyLayout />}>
    <Route path="/faculty-requirements/dashboard" element={<FacultyDashboardPage />} />
    <Route path="/faculty-requirements/submission" element={<FacultySubmissionPage />} />
    <Route path="/faculty-requirements/analytics" element={<FacultyAnalyticsPage />} />
    <Route path="/faculty-requirements/archive" element={<FacultyArchivePage />} />
    <Route path="/faculty-requirements/hub" element={<FacultyTemplateHubPage />} />
  </Route>
);
