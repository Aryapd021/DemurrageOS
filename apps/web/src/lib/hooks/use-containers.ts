import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";

export function useContainers(clientId?: string | "ALL") {
  return useQuery({
    queryKey: ["containers", clientId ?? "ALL"],
    queryFn: () => apiClient.getContainers(clientId),
  });
}

export function useContainer(containerId: string) {
  return useQuery({
    queryKey: ["container", containerId],
    queryFn: () => apiClient.getContainerById(containerId),
    enabled: !!containerId,
  });
}

export function useTriggerDpdFallback() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (containerId: string) => apiClient.triggerDpdFallback(containerId),
    onSuccess: (updated) => {
      queryClient.setQueryData(["container", updated.id], updated);
      queryClient.invalidateQueries({ queryKey: ["containers"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
    },
  });
}
