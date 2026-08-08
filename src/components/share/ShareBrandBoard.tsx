import { BrandBoardSections } from "@/components/brand/BrandBoardSections";
import type { ShareBrandBoard as BrandBoard } from "@/lib/venture-share.functions";

/**
 * Public showcase brand board — the full set of blocks, rendered by the same
 * component the founder's hub uses.
 */
export function ShareBrandBoard({ board }: { board: BrandBoard }) {
  return <BrandBoardSections board={board} className="mb-12" />;
}
