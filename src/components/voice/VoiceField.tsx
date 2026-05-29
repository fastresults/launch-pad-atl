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
  const appendTranscript = (text: string) => {
    const sep = value && !/\s$/.test(value) ? " " : "";
    onChange(value + sep + text);
    // Defer blur so the parent can persist after the value updates
    setTimeout(() => onBlur?.(), 0);
  };

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
