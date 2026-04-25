import { useEffect } from "react";
import { getCurrentWebviewWindow, getAllWebviewWindows } from "@tauri-apps/api/webviewWindow";
import { Titlebar } from "@/components/Titlebar";
import { AuthProvider } from "@/features/auth/contexts/AuthContext";
import { AppRoutes } from "@/routes/AppRoutes";
import { ToastProvider } from "@/components/ui/toast/toaster";
import { SubmissionProvider } from "@/features/faculty-requirements/contexts/SubmissionContext";
import "./style.css";

function App() {
  useEffect(() => {
    // Show the window once the app is mounted and close the splashscreen
    const showWindow = async () => {
      try {
        console.log("App mounted, signaling Tauri to handle window transition...");
        const main = getCurrentWebviewWindow();
        
        // Find the splashscreen window
        const allWebviews = await getAllWebviewWindows();
        const splash = allWebviews.find(w => w.label === 'splashscreen');

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
