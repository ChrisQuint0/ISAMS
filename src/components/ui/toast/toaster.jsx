import * as React from "react";
import * as ToastPrimitive from "@radix-ui/react-toast";
import { cn } from "@/lib/utils";

const ToastContext = React.createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = React.useState([]);

  const addToast = React.useCallback(
    (options) => {
      const id = Math.random().toString(36).substr(2, 9);
      const toast = {
        id,
        title: options.title,
        description: options.description,
        variant: options.variant || "default",
        duration: options.duration || 5000,
      };

      setToasts((prev) => [...prev, toast]);



      return id;
    },
    []
  );

  const removeToast = React.useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      <ToastPrimitive.Provider>
        {children}
        <ToastViewport />
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            {...toast}
            onOpenChange={(open) => {
              if (!open) removeToast(toast.id);
            }}
          />
        ))}
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}

function ToastViewport() {
  return (
    <ToastPrimitive.Viewport className="fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]" />
  );
}

function Toast({
  id,
  title,
  description,
  variant = "default",
  duration = 5000,
  onOpenChange,
}) {
  const [open, setOpen] = React.useState(true);

  React.useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleOpenChange(false);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleOpenChange = (newOpen) => {
    setOpen(newOpen);
    if (!newOpen) {
      setTimeout(() => onOpenChange?.(false), 300);
    } else {
      onOpenChange?.(true);
    }
  };

  return (
    <ToastPrimitive.Root
      open={open}
      onOpenChange={handleOpenChange}
      className={cn(
        "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
        // 👇 CHANGED: Default is now a clean white card
        variant === "default" && "border-neutral-200 bg-white text-neutral-900",
        // 👇 CHANGED: Destructive uses semantic error tokens
        variant === "destructive" && "destructive group border-destructive bg-destructive text-white",
        // 👇 ADDED: Success variant for positive feedback
        variant === "success" && "success group border-success bg-success text-white"
      )}
    >
      <div className="flex flex-col gap-1">
        {title && (
          <ToastPrimitive.Title className="text-sm font-bold">
            {title}
          </ToastPrimitive.Title>
        )}
        {description && (
          <ToastPrimitive.Description className="text-sm opacity-90 font-medium">
            {description}
          </ToastPrimitive.Description>
        )}
      </div>
      {/* 👇 CHANGED: Close button colors adapt to the background */}
      <ToastPrimitive.Close className="inline-flex h-8 shrink-0 items-center justify-center rounded-md p-1 opacity-0 transition-opacity focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring group-hover:opacity-100 text-neutral-500 hover:text-neutral-900 group-[.destructive]:text-white/70 group-[.destructive]:hover:text-white group-[.success]:text-white/70 group-[.success]:hover:text-white">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
        >
          <path d="M18 6l-12 12M6 6l12 12" />
        </svg>
      </ToastPrimitive.Close>
    </ToastPrimitive.Root>
  );
}