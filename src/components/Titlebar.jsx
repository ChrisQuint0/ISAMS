import { useState, useEffect } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Minus, Square, Copy, X } from "lucide-react";
import isamsLogo from "@/assets/images/isams_logo_icon.svg";

export function Titlebar() {
  const [isMaximized, setIsMaximized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [appWindow, setAppWindow] = useState(null);

  useEffect(() => {
    let unlisten = null;

    const setupWindow = async () => {
      try {
        if (window.__TAURI_INTERNALS__) {
          const win = getCurrentWindow();
          setAppWindow(win);
          setIsMaximized(await win.isMaximized());
          setIsFullscreen(await win.isFullscreen());
          unlisten = await win.onResized(async () => {
            setIsMaximized(await win.isMaximized());
            setIsFullscreen(await win.isFullscreen());
          });
        }
      } catch (error) {
        console.warn("Tauri window API not available:", error);
      }
    };

    setupWindow();
    return () => { if (unlisten) unlisten(); };
  }, []);

  const handleMinimize = () => appWindow?.minimize();
  const handleMaximizeToggle = async () => {
    if (!appWindow) return;
    if (isFullscreen) {
      await appWindow.setFullscreen(false);
    } else {
      await appWindow.toggleMaximize();
    }
  };
  const handleClose = () => appWindow?.close();

  return (
    <div
      className="h-[var(--titlebar-height)] flex items-center justify-between bg-white border-b border-gray-100 select-none shrink-0 relative overflow-hidden z-[100]"
    >
      {/* Background Drag Region */}
      <div
        data-tauri-drag-region
        className="absolute inset-0 z-0 cursor-default"
      />

      <div className="relative z-10 flex items-center px-4 gap-2 pointer-events-none">
        <img src={isamsLogo} alt="Logo" className="w-4 h-4 object-contain" />
        <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
          ISAMS
        </span>
      </div>

      <div className="relative z-20 flex items-center h-full">
        {appWindow && (
          <>
            <button
              onClick={handleMinimize}
              className="h-full px-4 flex items-center justify-center hover:bg-gray-100 transition-colors group relative"
              title="Minimize"
            >
              <Minus className="w-3.5 h-3.5 text-gray-500 group-hover:text-gray-900" />
            </button>

            <button
              onClick={handleMaximizeToggle}
              className="h-full px-4 flex items-center justify-center hover:bg-gray-100 transition-colors group relative"
              title={isMaximized || isFullscreen ? "Restore Down" : "Maximize"}
            >
              {isMaximized || isFullscreen ? (
                <Copy className="w-3 h-3 text-gray-500 group-hover:text-gray-900" />
              ) : (
                <Square className="w-3 h-3 text-gray-500 group-hover:text-gray-900" />
              )}
            </button>

            <button
              onClick={handleClose}
              className="h-full px-4 flex items-center justify-center hover:bg-red-500 transition-colors group relative"
              title="Close"
            >
              <X className="w-3.5 h-3.5 text-gray-500 group-hover:text-white" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
