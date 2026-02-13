import { Route, Navigate } from "react-router-dom";
import ThesisArchivingPage from "@/features/thesis-archiving/pages/ThesisArchivingPage";
import ThesisArchivingDashboardPage from "@/features/thesis-archiving/pages/ThesisArchivingDashboardPage";
import DigitalRepositoryPage from "@/features/thesis-archiving/pages/DigitalRepositoryPage";
import SimilarityCheckPage from "@/features/thesis-archiving/pages/SimilarityCheckPage";

export const ThesisArchivingRoutes = (ProtectedRoute) => (
    <>
        <Route
            element={
                <ProtectedRoute>
                    <ThesisArchivingPage />
                </ProtectedRoute>
            }
        >
            <Route path="/thesis-archiving" element={<Navigate to="/thesis-archiving/dashboard" replace />} />
            <Route path="/thesis-archiving/dashboard" element={<ThesisArchivingDashboardPage />} />
            <Route path="/thesis-archiving/digital-repository" element={<DigitalRepositoryPage />} />
            <Route path="/thesis-archiving/similarity-check" element={<SimilarityCheckPage />} />
        </Route>
    </>
);
