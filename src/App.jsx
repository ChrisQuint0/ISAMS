import { Titlebar } from "@/components/Titlebar";
import { AuthProvider } from "@/features/auth/contexts/AuthContext";
import { AppRoutes } from "@/routes/AppRoutes";
import { ToastProvider } from "@/components/ui/toast/toaster";
import "./style.css";

function App() {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white">
      <Titlebar />
      <div className="flex-1 min-h-0 overflow-auto relative">
        <AuthProvider>
          <ToastProvider>
            <AppRoutes />
          </ToastProvider>
        </AuthProvider>
      </div>
    </div>
  );
}

export default App;
