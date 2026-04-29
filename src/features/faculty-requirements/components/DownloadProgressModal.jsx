import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { X, Download } from "lucide-react";

export function DownloadProgressModal({
  isOpen,
  progressBytes,
  totalBytes,
  onCancel,
  title = "Downloading Archive...",
  description = "Please wait while we package and download your files. This may take a moment."
}) {
  const formatBytes = (bytes) => {
    if (!+bytes) return '0 MB';
    const k = 1024;
    const mb = bytes / (k * k);
    return `${mb.toFixed(2)} MB`;
  };

  // Indeterminate if we are still waiting for the backend fetch to start
  const isInitializing = totalBytes === 0 && progressBytes === 0;
  
  const hasTotal = !!totalBytes && totalBytes > 0;
  const percentage = hasTotal ? Math.min(100, Math.round((progressBytes / totalBytes) * 100)) : 0;

  return (
    <Dialog open={isOpen} onOpenChange={(val) => {
      // Prevent closing by clicking outside during active download
      if (!val && onCancel) {
        onCancel();
      }
    }}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => { e.preventDefault(); }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary-600">
            <Download className="h-5 w-5 animate-pulse" />
            {title}
          </DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col space-y-4 py-4">
          <div className="flex items-center justify-between text-sm font-medium">
             <span className="text-neutral-500">
               {isInitializing 
                 ? "Preparing download..." 
                 : `Downloaded: ${formatBytes(progressBytes)} ${hasTotal ? `/ ${formatBytes(totalBytes)}` : ""}`
               }
             </span>
             {!isInitializing && hasTotal && <span className="text-primary-600 font-bold">{percentage}%</span>}
          </div>

          {isInitializing ? (
              // Indeterminate styling using a solid pulsing bar while calculating size and fetching
              <div className="h-3 w-full bg-neutral-100 rounded-full overflow-hidden relative">
                  <div className="h-full bg-primary-600 animate-[pulse_1s_ease-in-out_infinite] rounded-full" style={{ width: '100%' }}></div>
              </div>
          ) : (
              <Progress value={percentage} indicatorClassName="bg-primary-600" className="h-3 w-full transition-all duration-500" />
          )}
        </div>

        <div className="flex justify-end pt-2">
          <Button
            variant="destructive"
            onClick={onCancel}
            className="w-full sm:w-auto font-bold shadow-sm active:scale-95 transition-all"
          >
            <X className="mr-2 h-4 w-4" /> Cancel Download
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
