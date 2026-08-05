"use client";

import React from "react";

interface AdminConfirmModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  isLoading?: boolean;
}

export function AdminConfirmModal({
  isOpen,
  onOpenChange,
  title = "Delete item permanently?",
  description = "This action cannot be undone. Are you sure you want to proceed?",
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  onConfirm,
  isLoading = false,
}: AdminConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full sm:max-w-[420px] rounded-2xl border border-rose-500/30 bg-[#0f111a] p-6 text-slate-100 shadow-2xl shadow-rose-950/40 backdrop-blur-xl relative">
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          ✕
        </button>

        <div className="flex items-center gap-3 border-b border-rose-500/10 pb-4 mb-3">
          <span className="text-xl">⚠️</span>
          <h3 className="text-lg font-bold text-rose-400 m-0">
            {title}
          </h3>
        </div>

        <div className="py-2 text-sm text-slate-300 leading-relaxed mb-4">
          {description}
        </div>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
          <button
            type="button"
            className="rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-500 shadow-lg shadow-rose-600/30 transition-colors flex items-center gap-2 cursor-pointer"
            onClick={async () => {
              await onConfirm();
              onOpenChange(false);
            }}
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
