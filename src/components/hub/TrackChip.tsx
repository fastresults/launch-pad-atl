import { TRACK_META, trackChipClass, type AssetTrack } from "@/lib/asset-tracks";

export function TrackChip({ track, className = "" }: { track: AssetTrack; className?: string }) {
  const Icon = TRACK_META[track].icon;
  return (
    <span className={trackChipClass(track, className)} title={`${track} track`}>
      <Icon className="h-2.5 w-2.5" aria-hidden />
      {TRACK_META[track].label}
    </span>
  );
}
