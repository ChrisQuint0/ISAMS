import { AuthProvider } from "@/features/auth/contexts/AuthContext";
import { AppRoutes } from "@/routes/AppRoutes";
import "./style.css";

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
