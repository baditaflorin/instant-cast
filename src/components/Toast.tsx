import { X } from "lucide-react";

interface ToastProps {
  message: string | null;
  onDismiss: () => void;
}

export function Toast({ message, onDismiss }: ToastProps) {
  if (!message) return null;

  return (
    <div
      role="status"
      className="fixed bottom-4 left-1/2 z-50 flex w-[min(560px,calc(100vw-32px))] -translate-x-1/2 items-center justify-between gap-4 rounded-md bg-ink px-4 py-3 text-sm font-semibold text-white shadow-panel"
    >
      <span>{message}</span>
      <button
        type="button"
        title="Dismiss"
        aria-label="Dismiss"
        onClick={onDismiss}
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md hover:bg-white/10"
      >
        <X size={18} aria-hidden="true" />
      </button>
    </div>
  );
}
