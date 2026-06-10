import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { gameServerAPI, GameServer } from "@/lib/gameserver-api";

const GAMESERVER_KEY = "gameservers";

export function useGameServers(controlPlaneId: string, options?: { limit?: number; offset?: number }) {
  return useQuery({
    queryKey: [GAMESERVER_KEY, controlPlaneId, options],
    queryFn: () => gameServerAPI.list(controlPlaneId),
    enabled: !!controlPlaneId,
  });
}

export function useGameServer(controlPlaneId: string, namespace: string, name: string) {
  return useQuery({
    queryKey: [GAMESERVER_KEY, controlPlaneId, namespace, name],
    queryFn: () => gameServerAPI.get(controlPlaneId, namespace, name),
    enabled: !!controlPlaneId && !!namespace && !!name,
  });
}

export function useGameServerActions(controlPlaneId: string, namespace: string, name: string) {
  return useQuery({
    queryKey: [GAMESERVER_KEY, controlPlaneId, namespace, name, "actions"],
    queryFn: () => gameServerAPI.listActions(controlPlaneId, namespace, name),
    enabled: !!controlPlaneId && !!namespace && !!name,
  });
}

export function useCreateGameServer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      controlPlaneId,
      namespace,
      server,
    }: {
      controlPlaneId: string;
      namespace: string;
      server: Partial<GameServer>;
    }) => gameServerAPI.create(controlPlaneId, namespace, server),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [GAMESERVER_KEY, variables.controlPlaneId] });
    },
  });
}

export function useDeleteGameServer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      controlPlaneId,
      namespace,
      name,
    }: {
      controlPlaneId: string;
      namespace: string;
      name: string;
    }) => gameServerAPI.delete(controlPlaneId, namespace, name),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [GAMESERVER_KEY, variables.controlPlaneId] });
    },
  });
}

export function useExecuteAction() {
  return useMutation({
    mutationFn: ({
      controlPlaneId,
      namespace,
      name,
      action,
      params,
    }: {
      controlPlaneId: string;
      namespace: string;
      name: string;
      action: string;
      params?: Record<string, string>;
    }) => gameServerAPI.executeAction(controlPlaneId, namespace, name, action, params),
  });
}
