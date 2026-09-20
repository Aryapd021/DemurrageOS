import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { DashboardMetrics } from "@demurrageos/shared-types";

export function useDashboardMetrics(clientId: string | "ALL" = "ALL") {
  return useQuery<DashboardMetrics>({
    queryKey: ["dashboard-metrics", clientId],
    queryFn: () => apiClient.getDashboardMetrics(clientId),
  });
}
