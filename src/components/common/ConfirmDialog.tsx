import * as React from "react";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  title: React.ReactNode;
  description?: React.ReactNode;

  trigger: React.ReactNode; // nút/element để mở dialog
  confirmText?: string;
  cancelText?: string;

  onConfirm: () => void | Promise<void>;
  confirmDisabled?: boolean;
  cancelDisabled?: boolean;

  // optional: cho destructive style
  variant?: "default" | "destructive";
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  trigger,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  confirmDisabled = false,
  cancelDisabled = false,
  variant = "default",
}: ConfirmDialogProps) {
  const actionClassName =
    variant === "destructive"
      ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
      : "";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description ? (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          ) : null}
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={cancelDisabled}>
            {cancelText}
          </AlertDialogCancel>

          <AlertDialogAction
            className={actionClassName}
            disabled={confirmDisabled}
            onClick={onConfirm}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
