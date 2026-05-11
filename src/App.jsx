import { useEffect, useState } from "react";
import {
  getCurrentWebviewWindow,
  getAllWebviewWindows,
} from "@tauri-apps/api/webviewWindow";
import { Titlebar } from "@/components/Titlebar";
import { AuthProvider } from "@/features/auth/contexts/AuthContext";
import { AppRoutes } from "@/routes/AppRoutes";
import { ToastProvider } from "@/components/ui/toast/toaster";
import { SubmissionProvider } from "@/features/faculty-requirements/contexts/SubmissionContext";
import { configService } from "@/lib/configService";
import "./style.css";

function App() {
  const [configLoaded, setConfigLoaded] = useState(false);
  const [configError, setConfigError] = useState(null);

  useEffect(() => {
    // Load system configuration on app startup
    const initializeApp = async () => {
      try {
        console.log("🚀 Initializing ISAMS...");
        await configService.loadConfig();
        setConfigLoaded(true);
        console.log("✅ System config loaded successfully");
      } catch (error) {
        console.error("❌ Failed to load system configuration:", error);
        setConfigError(error.message || "Failed to load system configuration");
      }
    };

    initializeApp();
  }, []);

  useEffect(() => {
    // Show the window once the app is mounted and close the splashscreen
    const showWindow = async () => {
      try {
        console.log(
          "App mounted, signaling Tauri to handle window transition...",
        );
        const main = getCurrentWebviewWindow();

        // Find the splashscreen window
        const allWebviews = await getAllWebviewWindows();
        const splash = allWebviews.find((w) => w.label === "splashscreen");

        // Wait a small amount for the first paint
        setTimeout(async () => {
          // Show the main window
          await main.show();

          // Close the splashscreen if it exists
          if (splash) {
            await splash.close();
          }

          console.log("Window transition complete");
        }, 1000); // 1s delay for a smoother experience
      } catch (error) {
        console.error("Failed to transition windows:", error);
      }
    };
    showWindow();
  }, []);

  // Show loading state while config is being loaded
  if (!configLoaded) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center space-y-4">
          {configError ? (
            <>
              <div className="text-red-600 text-2xl font-semibold">
                ⚠️ Configuration Error
              </div>
              <p className="text-gray-700 max-w-md mx-auto px-4">
                {configError}
              </p>
              <p className="text-sm text-gray-500 mt-4">
                Please check your Supabase connection and try again.
              </p>
            </>
          ) : (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 text-lg">
                Loading system configuration...
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white">
      <Titlebar />
      <div className="flex-1 min-h-0 overflow-auto relative">
        <AuthProvider>
          <ToastProvider>
            <SubmissionProvider>
              <AppRoutes />
            </SubmissionProvider>
          </ToastProvider>
        </AuthProvider>
      </div>
    </div>
  );
}

export default App;
