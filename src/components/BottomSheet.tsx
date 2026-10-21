"use client";

import { Check, X } from "lucide-react";
import { useEffect, type ReactNode } from "react";

export function BottomSheet({
  open,
  onClose,
  title,
  children,
  validate,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  validate?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 md:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="sheet-in max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl bg-white px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-3 shadow-xl md:max-w-lg md:rounded-3xl"
      >
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-200 md:hidden" />
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <button onClick={onClose} aria-label="Fermer" className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-600 active:bg-slate-200">
            <X size={20} />
          </button>
        </div>
        {children}
        {validate && (
          <div className="sticky bottom-0 -mx-5 mt-5 border-t border-slate-100 bg-white/95 px-5 pt-3 backdrop-blur">
            <button
              onClick={onClose}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-teal-600 text-base font-bold text-white shadow-sm active:bg-teal-700"
            >
              <Check size={22} strokeWidth={2.5} /> {validate}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
