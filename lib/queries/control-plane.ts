import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { controlPlaneAPI } from "@/lib/control-plane-api";

const CP_KEY = "control-planes";

export function useControlPlanes() {
  return useQuery({
    queryKey: [CP_KEY],
    queryFn: () => controlPlaneAPI.list(),
  });
}

export function useControlPlane(id: string) {
  return useQuery({
    queryKey: [CP_KEY, id],
    queryFn: () => controlPlaneAPI.get(id),
    enabled: !!id,
  });
}

export function useCreateControlPlane() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof controlPlaneAPI.create>[0]) =>
      controlPlaneAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CP_KEY] });
    },
  });
}

export function useDeleteControlPlane() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => controlPlaneAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CP_KEY] });
    },
  });
}
