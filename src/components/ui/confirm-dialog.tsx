import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type ConfirmOptions = {
  title: string;
  description?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
};

type PromptOptions = {
  title: string;
  description?: React.ReactNode;
  label?: string;
  placeholder?: string;
  defaultValue?: string;
  confirmText?: string;
  cancelText?: string;
  multiline?: boolean;
  required?: boolean;
};

type Ctx = {
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
  prompt: (opts: PromptOptions) => Promise<string | null>;
};

const ConfirmCtx = createContext<Ctx | null>(null);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [confirmState, setConfirmState] = useState<
    (ConfirmOptions & { open: boolean }) | null
  >(null);
  const confirmResolver = useRef<((v: boolean) => void) | undefined>(undefined);

  const [promptState, setPromptState] = useState<
    (PromptOptions & { open: boolean }) | null
  >(null);
  const [promptValue, setPromptValue] = useState("");
  const promptResolver = useRef<((v: string | null) => void) | undefined>(undefined);

  const confirm = useCallback((opts: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      confirmResolver.current = resolve;
      setConfirmState({ ...opts, open: true });
    });
  }, []);

  const prompt = useCallback((opts: PromptOptions) => {
    return new Promise<string | null>((resolve) => {
      promptResolver.current = resolve;
      setPromptValue(opts.defaultValue ?? "");
      setPromptState({ ...opts, open: true });
    });
  }, []);

  const closeConfirm = (result: boolean) => {
    confirmResolver.current?.(result);
    confirmResolver.current = undefined;
    setConfirmState((s) => (s ? { ...s, open: false } : s));
  };

  const closePrompt = (result: string | null) => {
    promptResolver.current?.(result);
    promptResolver.current = undefined;
    setPromptState((s) => (s ? { ...s, open: false } : s));
  };

  return (
    <ConfirmCtx.Provider value={{ confirm, prompt }}>
      {children}

      <AlertDialog
        open={!!confirmState?.open}
        onOpenChange={(o) => {
          if (!o && confirmResolver.current) closeConfirm(false);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmState?.title}</AlertDialogTitle>
            {confirmState?.description && (
              <AlertDialogDescription>{confirmState.description}</AlertDialogDescription>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => closeConfirm(false)}>
              {confirmState?.cancelText ?? "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => closeConfirm(true)}
              className={
                confirmState?.destructive
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : undefined
              }
            >
              {confirmState?.confirmText ?? "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={!!promptState?.open}
        onOpenChange={(o) => {
          if (!o && promptResolver.current) closePrompt(null);
        }}
      >
        <DialogContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (promptState?.required && !promptValue.trim()) return;
              closePrompt(promptValue);
            }}
          >
            <DialogHeader>
              <DialogTitle>{promptState?.title}</DialogTitle>
              {promptState?.description && (
                <DialogDescription>{promptState.description}</DialogDescription>
              )}
            </DialogHeader>
            <div className="space-y-2 py-3">
              {promptState?.label && <Label>{promptState.label}</Label>}
              {promptState?.multiline ? (
                <textarea
                  autoFocus
                  className="flex min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder={promptState.placeholder}
                  value={promptValue}
                  onChange={(e) => setPromptValue(e.target.value)}
                />
              ) : (
                <Input
                  autoFocus
                  placeholder={promptState?.placeholder}
                  value={promptValue}
                  onChange={(e) => setPromptValue(e.target.value)}
                />
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => closePrompt(null)}>
                {promptState?.cancelText ?? "Cancel"}
              </Button>
              <Button
                type="submit"
                disabled={promptState?.required && !promptValue.trim()}
              >
                {promptState?.confirmText ?? "OK"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </ConfirmCtx.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmCtx);
  if (!ctx) throw new Error("useConfirm must be used within ConfirmProvider");
  return ctx.confirm;
}

export function usePrompt() {
  const ctx = useContext(ConfirmCtx);
  if (!ctx) throw new Error("usePrompt must be used within ConfirmProvider");
  return ctx.prompt;
}

/** Standalone controlled prompt dialog (compat with older callers). */
export function PromptDialog({
  open,
  onOpenChange,
  title,
  description,
  inputLabel,
  placeholder,
  confirmLabel = "OK",
  cancelLabel = "Cancel",
  defaultValue = "",
  maxLength,
  loading = false,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  inputLabel?: string;
  placeholder?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  defaultValue?: string;
  maxLength?: number;
  loading?: boolean;
  onConfirm: (value: string) => void;
}) {
  const [value, setValue] = useState(defaultValue);
  useEffect(() => {
    if (open) setValue(defaultValue);
  }, [open, defaultValue]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!value.trim() || loading) return;
            onConfirm(value.trim());
          }}
        >
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
          <div className="space-y-2 py-3">
            {inputLabel && <Label>{inputLabel}</Label>}
            <Input
              autoFocus
              placeholder={placeholder}
              value={value}
              maxLength={maxLength}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
              {cancelLabel}
            </Button>
            <Button type="submit" disabled={!value.trim() || loading}>
              {confirmLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
