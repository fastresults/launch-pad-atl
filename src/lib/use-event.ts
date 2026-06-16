import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { listCohorts } from "@/lib/cohorts.functions";
import { getNextAvailable, FALLBACK_COHORT, type Cohort } from "@/lib/cohorts";
import { buildEvent } from "@/lib/schedule-data";

export function useEvent() {
  const { data: cohorts = [] } = useQuery<Cohort[]>({
    queryKey: ["cohorts"],
    queryFn: listCohorts,
    initialData: [],
    initialDataUpdatedAt: 0,
    staleTime: 60_000,
  });
  return useMemo(
    () => buildEvent(getNextAvailable(cohorts) ?? FALLBACK_COHORT),
    [cohorts],
  );
}
