import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listCohorts } from "@/lib/cohorts.functions";
import { getNextAvailable, FALLBACK_COHORT, type Cohort } from "@/lib/cohorts";
import { buildEvent } from "@/lib/schedule-data";

export function useEvent() {
  const fetchCohorts = useServerFn(listCohorts);
  const { data: cohorts = [] } = useQuery<Cohort[]>({
    queryKey: ["cohorts"],
    queryFn: () => fetchCohorts(),
    initialData: [],
    staleTime: 60_000,
  });
  return useMemo(
    () => buildEvent(getNextAvailable(cohorts) ?? FALLBACK_COHORT),
    [cohorts],
  );
}
