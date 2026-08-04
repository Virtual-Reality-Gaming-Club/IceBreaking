"use client";

import React from "react";
import { AlertDialog, Button } from "@heroui/react";

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
    <AlertDialog isOpen={isOpen} onOpenChange={onOpenChange}>
      <AlertDialog.Backdrop className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
        <AlertDialog.Container className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <AlertDialog.Dialog className="w-full sm:max-w-[420px] rounded-2xl border border-rose-500/30 bg-[#0f111a] p-6 text-slate-100 shadow-2xl shadow-rose-950/40 backdrop-blur-xl">
            <AlertDialog.CloseTrigger className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white" />
            
            <AlertDialog.Header className="flex items-center gap-3 border-b border-rose-500/10 pb-4">
              <AlertDialog.Icon status="danger" />
              <AlertDialog.Heading className="text-lg font-bold text-rose-400">
                {title}
              </AlertDialog.Heading>
            </AlertDialog.Header>

            <AlertDialog.Body className="py-4 text-sm text-slate-300 leading-relaxed">
              {description}
            </AlertDialog.Body>

            <AlertDialog.Footer className="flex items-center justify-end gap-3 pt-2">
              <Button
                slot="close"
                variant="tertiary"
                className="rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
                isDisabled={isLoading}
              >
                {cancelLabel}
              </Button>
              <Button
                variant="danger"
                className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-500 shadow-lg shadow-rose-600/30 transition-colors flex items-center gap-2 cursor-pointer"
                onClick={async () => {
                  await onConfirm();
                  onOpenChange(false);
                }}
                isDisabled={isLoading}
              >
                {isLoading ? "Processing..." : confirmLabel}
              </Button>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </AlertDialog>
  );
}
