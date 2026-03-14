import { useState, useEffect } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Minus, Square, Copy, X } from "lucide-react";

export function Titlebar() {
  const [isMaximized, setIsMaximized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [appWindow, setAppWindow] = useState(null);

  useEffect(() => {
    let unlisten = null;

    const setupWindow = async () => {
      try {
        // Only attempt to get window if we're likely in a Tauri environment
        if (window.__TAURI_INTERNALS__) {
          const win = getCurrentWindow();
          setAppWindow(win);

          // Check initial state
          setIsMaximized(await win.isMaximized());
          setIsFullscreen(await win.isFullscreen());

          // Listen for resize/state changes
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

    return () => {
      if (unlisten) {
        unlisten();
      }
    };
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
      data-tauri-drag-region
      className="h-[var(--titlebar-height)] flex items-center justify-between bg-white border-b border-gray-100 select-none shrink-0"
    >
      <div className="flex items-center px-4 gap-2 pointer-events-none">
        <div className="w-4 h-4 rounded bg-primary-500/10 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-primary-500" />
        </div>
        <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
          ISAMS
        </span>
      </div>

      <div className="flex items-center h-full">
        {appWindow && (
          <>
            <button
              onClick={handleMinimize}
              className="h-full px-4 flex items-center justify-center hover:bg-gray-100 transition-colors group"
              title="Minimize"
            >
              <Minus className="w-3.5 h-3.5 text-gray-500 group-hover:text-gray-900" />
            </button>

            <button
              onClick={handleMaximizeToggle}
              className="h-full px-4 flex items-center justify-center hover:bg-gray-100 transition-colors group"
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
              className="h-full px-4 flex items-center justify-center hover:bg-red-500 transition-colors group"
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
