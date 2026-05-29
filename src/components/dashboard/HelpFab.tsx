import { HelpCircle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function HelpFab() {
  return (
    <div className="fixed bottom-4 left-4 z-50">
      <Popover>
        <PopoverTrigger asChild>
          <button
            className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-card shadow-lg hover:bg-card/80 transition"
            aria-label="Need help?"
          >
            <HelpCircle className="h-5 w-5" />
          </button>
        </PopoverTrigger>
        <PopoverContent side="top" align="start" className="w-72">
          <div className="text-sm">
            <div className="font-medium">Need a hand?</div>
            <p className="mt-1 text-muted-foreground">
              In the room, raise your hand or use the <strong>Raise hand</strong> button on the current stage.
            </p>
            <p className="mt-2 text-muted-foreground">
              Outside the room, email <a href="mailto:fastresults@gmail.com" className="text-primary underline-offset-4 hover:underline">fastresults@gmail.com</a> and we'll get back to you.
            </p>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
