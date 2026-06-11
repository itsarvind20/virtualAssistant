import React from "react";
import { Check, X } from "lucide-react";

function ConfirmationModal({ open, message, onConfirm, onCancel }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/55 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg border border-white/10 bg-[#07111f] p-5 text-white shadow-2xl">
        <p className="text-xs uppercase tracking-[0.25em] text-cyan-100/60">confirmation</p>
        <h2 className="mt-3 text-xl font-semibold">{message}</h2>
        <p className="mt-3 text-sm text-white/60">You can click a button or say "yes" / "no" by voice.</p>
        <div className="mt-5 flex gap-3">
          <button
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-cyan-300 px-4 text-sm font-semibold text-black transition hover:bg-cyan-200"
            onClick={onConfirm}
            type="button"
          >
            <Check size={17} />
            Yes
          </button>
          <button
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 text-sm font-semibold text-white transition hover:bg-white/20"
            onClick={onCancel}
            type="button"
          >
            <X size={17} />
            No
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmationModal;
