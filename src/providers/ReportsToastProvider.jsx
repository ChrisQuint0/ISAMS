import { ToastProvider } from "@/components/ui/toast/toaster";

/**
 * ReportsToastProvider - Wrapper component for toast notifications
 * 
 * Usage in App.jsx:
 * import ReportsToastProvider from "@/providers/ReportsToastProvider";
 * 
 * function App() {
 *   return (
 *     <AuthProvider>
 *       <ReportsToastProvider>
 *         <AppRoutes />
 *       </ReportsToastProvider>
 *     </AuthProvider>
 *   );
 * }
 */

export default function ReportsToastProvider({ children }) {
  return (
    <ToastProvider>
      {children}
    </ToastProvider>
  );
}
