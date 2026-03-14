import { useState, useEffect } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Minus, Square, Copy, X } from "lucide-react";

export function Titlebar() {
  const [isMaximized, setIsMaximized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const appWindow = getCurrentWindow();

  useEffect(() => {
    // Check initial state
    const checkState = async () => {
      setIsMaximized(await appWindow.isMaximized());
      setIsFullscreen(await appWindow.isFullscreen());
    };
    checkState();

    // Listen for resize/state changes
    const unlisten = appWindow.onResized(async () => {
      setIsMaximized(await appWindow.isMaximized());
      setIsFullscreen(await appWindow.isFullscreen());
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, [appWindow]);

  const handleMinimize = () => appWindow.minimize();

  const handleMaximizeToggle = async () => {
    if (isFullscreen) {
      await appWindow.setFullscreen(false);
    } else {
      await appWindow.toggleMaximize();
    }
  };

  const handleClose = () => appWindow.close();

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
      </div>
    </div>
  );
}
