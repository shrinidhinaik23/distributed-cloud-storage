import { CheckCircle2, AlertCircle, X } from "lucide-react";

export default function Toast({ toast, onClose }) {
  if (!toast) return null;

  return (
    <div className={`toast toast-${toast.type}`}>
      <div className="toast-left">
        {toast.type === "success" ? (
          <CheckCircle2 size={18} />
        ) : (
          <AlertCircle size={18} />
        )}
        <span>{toast.message}</span>
      </div>

      <button className="toast-close" onClick={onClose} type="button">
        <X size={16} />
      </button>
    </div>
  );
}