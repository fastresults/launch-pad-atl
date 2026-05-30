import { useCallback, useEffect, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { VoiceRecorder } from "./VoiceRecorder";

type Props = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  multiline?: boolean;
  context?: string;
  disabled?: boolean;
};

export function VoiceField({ label, value, onChange, onBlur, placeholder, multiline, context, disabled }: Props) {
  // Keep refs to the latest value/callbacks so the transcript handler (which
  // can fire seconds after recording started) always sees the current state
  // and writes to the correct field.
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  const onBlurRef = useRef(onBlur);
  useEffect(() => {
    valueRef.current = value;
    onChangeRef.current = onChange;
    onBlurRef.current = onBlur;
  }, [value, onChange, onBlur]);

  const appendTranscript = useCallback((text: string) => {
    const cur = valueRef.current ?? "";
    const sep = cur && !/\s$/.test(cur) ? " " : "";
    const next = cur + sep + text;
    onChangeRef.current(next);
    // Defer blur so the parent can persist after the value updates
    setTimeout(() => onBlurRef.current?.(), 0);
  }, []);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-sm">{label}</Label>
        <VoiceRecorder onTranscript={appendTranscript} context={context ?? label} disabled={disabled} />
      </div>
      {multiline ? (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          rows={4}
          disabled={disabled}
        />
      ) : (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
        />
      )}
    </div>
  );
}
