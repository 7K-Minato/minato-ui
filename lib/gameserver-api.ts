export interface GameServer {
  apiVersion: string;
  kind: string;
  metadata: {
    name: string;
    namespace: string;
    creationTimestamp?: string;
    uid?: string;
  };
  spec: {
    profile: string;
    env?: Record<string, string>;
    storage?: {
      size?: string;
      storageClass?: string;
      snapshotRef?: {
        name: string;
        namespace: string;
      };
    };
    priorityClassName?: string;
    lifecycle?: {
      idleTimeoutSeconds?: number;
    };
  };
  status?: {
    state: "Provisioning" | "Running" | "Idle" | "Stopped" | "Error";
    players?: number;
    playerCapacity?: number;
    agentVersion?: string;
    endpoints?: Array<{
      name: string;
      address?: string;
      port: number;
    }>;
    conditions?: Array<{
      type: string;
      status: string;
      reason?: string;
      message?: string;
      lastTransitionTime?: string;
    }>;
  };
}

export interface GameServerFilter {
  namespace?: string;
  profile?: string;
  status?: string;
  search?: string;
  minPlayers?: number;
  maxPlayers?: number;
}

class GameServerAPI {
  async list(controlPlaneId: string): Promise<GameServer[]> {
    const res = await fetch(`/api/proxy/api/v1/gameservers`, {
      headers: {
        "X-Control-Plane-Id": controlPlaneId,
      },
    });
    if (!res.ok) throw new Error("Failed to fetch game servers");
    return res.json();
  }

  async get(
    controlPlaneId: string,
    namespace: string,
    name: string
  ): Promise<GameServer> {
    const res = await fetch(
      `/api/proxy/api/v1/gameservers/${namespace}/${name}`,
      {
        headers: {
          "X-Control-Plane-Id": controlPlaneId,
        },
      }
    );
    if (!res.ok) throw new Error("Failed to fetch game server");
    return res.json();
  }

  async create(
    controlPlaneId: string,
    namespace: string,
    server: Partial<GameServer>
  ): Promise<GameServer> {
    const res = await fetch(`/api/proxy/api/v1/gameservers/${namespace}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Control-Plane-Id": controlPlaneId,
      },
      body: JSON.stringify(server),
    });
    if (!res.ok) throw new Error("Failed to create game server");
    return res.json();
  }

  async delete(
    controlPlaneId: string,
    namespace: string,
    name: string
  ): Promise<void> {
    const res = await fetch(
      `/api/proxy/api/v1/gameservers/${namespace}/${name}`,
      {
        method: "DELETE",
        headers: {
          "X-Control-Plane-Id": controlPlaneId,
        },
      }
    );
    if (!res.ok) throw new Error("Failed to delete game server");
  }

  async listActions(
    controlPlaneId: string,
    namespace: string,
    name: string
  ): Promise<
    Array<{
      name: string;
      description: string;
      concurrency: string;
      timeout?: string;
      params?: Record<
        string,
        {
          type: string;
          required?: boolean;
          default?: string;
        }
      >;
    }>
  > {
    const res = await fetch(
      `/api/proxy/api/v1/gameservers/${namespace}/${name}/actions`,
      {
        headers: {
          "X-Control-Plane-Id": controlPlaneId,
        },
      }
    );
    if (!res.ok) throw new Error("Failed to fetch actions");
    return res.json();
  }

  async executeAction(
    controlPlaneId: string,
    namespace: string,
    name: string,
    action: string,
    params?: Record<string, string>
  ): Promise<{ name: string }> {
    const res = await fetch(
      `/api/proxy/api/v1/gameservers/${namespace}/${name}/actions/${action}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Control-Plane-Id": controlPlaneId,
        },
        body: JSON.stringify(params || {}),
      }
    );
    if (!res.ok) throw new Error("Failed to execute action");
    return res.json();
  }
}

export const gameServerAPI = new GameServerAPI();