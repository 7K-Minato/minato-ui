"use client";

import { useToastStore } from "./Toast";

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`rounded-lg border px-4 py-3 shadow-lg transition-all ${
            toast.type === "success"
              ? "border-green-500/30 bg-green-500/10 text-green-400"
              : toast.type === "error"
              ? "border-red-500/30 bg-red-500/10 text-red-400"
              : toast.type === "warning"
              ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-400"
              : "border-blue-500/30 bg-blue-500/10 text-blue-400"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-2 text-white/50 hover:text-white"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
