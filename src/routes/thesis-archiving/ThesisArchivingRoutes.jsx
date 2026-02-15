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
            path="/thesis-archiving"
            element={
                <ThesisProtectedRoute>
                    <ThesisArchivingPage />
                </ThesisProtectedRoute>
            }
        >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<ThesisArchivingDashboardPage />} />
            <Route path="digital-repository" element={<DigitalRepositoryPage />} />
            <Route path="similarity-check" element={<SimilarityCheckPage />} />
        </Route>
    </>
);
