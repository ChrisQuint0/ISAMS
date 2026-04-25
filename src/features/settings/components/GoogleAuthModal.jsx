import { useNavigate } from "react-router-dom";
import { ShieldAlert, X, ArrowRight } from "lucide-react";

/**
 * GoogleAuthModal
 *
 * Shown when the current user's Google OAuth token is expired or missing.
 * The "Authenticate" button navigates to /system-settings where they can
 * complete the Google Drive connection.
 *
 * Props:
 *   open      – boolean, controls visibility
 *   onClose   – optional callback when the user manually dismisses via ✕
 *               (omit or pass null to make the modal non-dismissible)
 */
export function GoogleAuthModal({ open, onClose }) {
  const navigate = useNavigate();

  if (!open) return null;

  const handleAuthenticate = () => {
    navigate("/system-settings");
    onClose?.();
  };

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
      onClick={onClose ? (e) => { if (e.target === e.currentTarget) onClose(); } : undefined}
    >
      {/* Card */}
      <div
        className="relative w-full max-w-md rounded-2xl overflow-hidden"
        style={{
          background: "#ffffff",
          boxShadow: "0 24px 60px rgba(0,0,0,0.18), 0 8px 20px rgba(0,0,0,0.08)",
          border: "1px solid rgba(0,0,0,0.06)",
        }}
      >
        {/* Top accent stripe */}
        <div
          className="h-1 w-full"
          style={{
            background:
              "linear-gradient(90deg, #f59e0b 0%, #ef4444 50%, #f59e0b 100%)",
          }}
        />

        {/* Close button (only shown if onClose is provided) */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-150"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* Body */}
        <div className="p-8">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
                border: "1.5px solid #f59e0b30",
                boxShadow: "0 4px 16px rgba(245,158,11,0.18)",
              }}
            >
              <ShieldAlert className="h-8 w-8" style={{ color: "#d97706" }} />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
            Google Authentication Required
          </h2>

          {/* Description */}
          <p className="text-sm text-gray-500 text-center leading-relaxed mb-2">
            Your Google account connection is{" "}
            <span className="font-semibold text-amber-600">
              expired or missing
            </span>
            .
          </p>
          <p className="text-sm text-gray-500 text-center leading-relaxed mb-8">
            Document uploads to Google Drive require an active authenticated
            session. Please go to{" "}
            <span className="font-semibold text-gray-700">System Settings</span>{" "}
            and re-authenticate your Google account.
          </p>

          {/* Divider */}
          <div
            className="h-px w-full mb-6"
            style={{ background: "rgba(0,0,0,0.06)" }}
          />

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button
              onClick={handleAuthenticate}
              className="w-full flex items-center justify-center gap-2.5 h-11 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: "linear-gradient(135deg, #008A45 0%, #00c46a 100%)",
                boxShadow: "0 4px 14px rgba(0,138,69,0.35)",
              }}
            >
              <img
                src="https://www.google.com/favicon.ico"
                className="w-4 h-4"
                alt="Google"
              />
              Authenticate with Google
              <ArrowRight className="h-4 w-4" />
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className="w-full h-10 rounded-xl text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all duration-150"
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
