import { Route, Navigate } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth";
import ThesisArchivingPage from "@/features/thesis-archiving/pages/ThesisArchivingPage";
import ThesisArchivingDashboardPage from "@/features/thesis-archiving/pages/ThesisArchivingDashboardPage";
import DigitalRepositoryPage from "@/features/thesis-archiving/pages/DigitalRepositoryPage";
import ThesisDetailPage from "@/features/thesis-archiving/pages/ThesisDetailPage";
import SimilarityCheckPage from "@/features/thesis-archiving/pages/SimilarityCheckPage";

// Local ProtectedRoute is no longer needed as we use the passed one

export const ThesisArchivingRoutes = (ProtectedRoute) => (
    <>
        <Route
            path="/thesis-archiving"
            element={
                <ProtectedRoute>
                    <ThesisArchivingPage />
                </ProtectedRoute>
            }
        >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<ThesisArchivingDashboardPage />} />
            <Route path="digital-repository">
                <Route index element={<DigitalRepositoryPage />} />
                <Route path=":id" element={<ThesisDetailPage />} />
            </Route>
            <Route path="similarity-check" element={<SimilarityCheckPage />} />
        </Route>
    </>
);
