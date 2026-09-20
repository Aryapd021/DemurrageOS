import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";

export function useDocuments(containerId: string) {
  return useQuery({
    queryKey: ["documents", containerId],
    queryFn: () => apiClient.getDocuments(containerId),
    enabled: !!containerId,
  });
}

export function useUpdateDocumentField() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { documentId: string; fieldKey: string; newValue: string | number }) =>
      apiClient.updateDocumentField(params),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["documents", updated.containerId] });
    },
  });
}

export function useAcceptDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (documentId: string) => apiClient.acceptDocument(documentId),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["documents", updated.containerId] });
    },
  });
}
