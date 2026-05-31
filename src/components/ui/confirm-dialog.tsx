import { useEffect, useRef, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type ConfirmVariant = "default" | "destructive";

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  loading?: boolean;
  /** When set, renders an optional reason textarea and passes its value to onConfirm. */
  reasonLabel?: string;
  reasonPlaceholder?: string;
  onConfirm: (reason?: string) => void | Promise<void>;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  loading = false,
  reasonLabel,
  reasonPlaceholder,
  onConfirm,
}: ConfirmDialogProps) {
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (open) setReason("");
  }, [open]);

  return (
    <AlertDialog open={open} onOpenChange={(o) => !loading && onOpenChange(o)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description ? (
            <AlertDialogDescription asChild>
              <div>{description}</div>
            </AlertDialogDescription>
          ) : null}
        </AlertDialogHeader>
        {reasonLabel ? (
          <div className="space-y-2">
            <Label htmlFor="confirm-dialog-reason">{reasonLabel}</Label>
            <Textarea
              id="confirm-dialog-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={reasonPlaceholder}
              maxLength={1000}
              rows={3}
              disabled={loading}
            />
          </div>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            disabled={loading}
            className={cn(
              variant === "destructive" &&
                "bg-destructive text-destructive-foreground hover:bg-destructive/90",
            )}
            onClick={(e) => {
              e.preventDefault();
              onConfirm(reasonLabel ? reason.trim() || undefined : undefined);
            }}
          >
            {loading ? "Working…" : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export interface PromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  inputLabel: string;
  placeholder?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  defaultValue?: string;
  required?: boolean;
  maxLength?: number;
  loading?: boolean;
  onConfirm: (value: string) => void | Promise<void>;
}

export function PromptDialog({
  open,
  onOpenChange,
  title,
  description,
  inputLabel,
  placeholder,
  confirmLabel = "Save",
  cancelLabel = "Cancel",
  defaultValue = "",
  required = true,
  maxLength = 120,
  loading = false,
  onConfirm,
}: PromptDialogProps) {
  const [value, setValue] = useState(defaultValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setValue(defaultValue);
      // focus after dialog opens
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open, defaultValue]);

  const trimmed = value.trim();
  const canSubmit = !loading && (!required || trimmed.length > 0);

  const submit = () => {
    if (!canSubmit) return;
    onConfirm(trimmed);
  };

  return (
    <AlertDialog open={open} onOpenChange={(o) => !loading && onOpenChange(o)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description ? (
            <AlertDialogDescription asChild>
              <div>{description}</div>
            </AlertDialogDescription>
          ) : null}
        </AlertDialogHeader>
        <div className="space-y-2">
          <Label htmlFor="prompt-dialog-input">{inputLabel}</Label>
          <Input
            id="prompt-dialog-input"
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submit();
              }
            }}
            placeholder={placeholder}
            maxLength={maxLength}
            disabled={loading}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            disabled={!canSubmit}
            onClick={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            {loading ? "Working…" : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
