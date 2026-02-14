import { Route, Navigate } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth";
import ThesisArchivingPage from "@/features/thesis-archiving/pages/ThesisArchivingPage";
import ThesisArchivingDashboardPage from "@/features/thesis-archiving/pages/ThesisArchivingDashboardPage";
import DigitalRepositoryPage from "@/features/thesis-archiving/pages/DigitalRepositoryPage";
import SimilarityCheckPage from "@/features/thesis-archiving/pages/SimilarityCheckPage";

const ThesisProtectedRoute = ({ children }) => {
    const { user } = useAuth();
    if (!user) {
        return <Navigate to="/login" replace />;
    }
    return children;
};

export const ThesisArchivingRoutes = () => (
    <>
        <Route
            element={
                <ThesisProtectedRoute>
                    <ThesisArchivingPage />
                </ThesisProtectedRoute>
            }
        >
            <Route path="/thesis-archiving" element={<Navigate to="/thesis-archiving/dashboard" replace />} />
            <Route path="/thesis-archiving/dashboard" element={<ThesisArchivingDashboardPage />} />
            <Route path="/thesis-archiving/digital-repository" element={<DigitalRepositoryPage />} />
            <Route path="/thesis-archiving/similarity-check" element={<SimilarityCheckPage />} />
        </Route>
    </>
);
