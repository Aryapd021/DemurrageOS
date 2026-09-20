import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { ExternalTaskConfirmationPayload } from "@demurrageos/shared-types";

export function useTasks(clientId?: string | "ALL") {
  return useQuery({
    queryKey: ["tasks", clientId ?? "ALL"],
    queryFn: () => apiClient.getTasks(clientId),
  });
}

export function useTask(taskId: string) {
  return useQuery({
    queryKey: ["task", taskId],
    queryFn: () => apiClient.getTaskById(taskId),
    enabled: !!taskId,
  });
}

export function useTaskByToken(token: string) {
  return useQuery({
    queryKey: ["task-token", token],
    queryFn: () => apiClient.getTaskByToken(token),
    enabled: !!token,
  });
}

export function useAssignExternalTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { taskId: string; assigneeName: string; assigneeContact: string }) =>
      apiClient.assignExternalTask(params),
    onSuccess: (updated) => {
      queryClient.setQueryData(["task", updated.id], updated);
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
    },
  });
}

export function useConfirmExternalTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ExternalTaskConfirmationPayload) =>
      apiClient.confirmExternalTask(payload),
    onSuccess: (updated, variables) => {
      queryClient.setQueryData(["task", updated.id], updated);
      queryClient.setQueryData(["task-token", variables.token], updated);
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["containers"] });
      queryClient.invalidateQueries({ queryKey: ["container", updated.containerId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
    },
  });
}
