import { useQuery } from "@tanstack/react-query";
import { fetchAlertsData } from "../lib/forestguard-api";

export function useAlerts() {
  return useQuery({
    queryKey: ["forestguard-alerts"],
    queryFn: () => fetchAlertsData(),
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
    refetchIntervalInBackground: true,
  });
}
