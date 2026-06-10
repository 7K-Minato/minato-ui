export interface GameServerFleet {
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
    replicas: number;
    template?: {
      spec?: {
        env?: Record<string, string>;
      };
      metadata?: {
        labels?: Record<string, string>;
        annotations?: Record<string, string>;
      };
    };
    updateStrategy?: {
      type?: string;
      rollingUpdate?: {
        maxUnavailable?: number;
      };
    };
    priorityClassName?: string;
    topologySpreadConstraints?: unknown[];
  };
  status?: {
    replicas: number;
    readyReplicas: number;
    updatedReplicas: number;
    availableReplicas: number;
    conditions?: Array<{
      type: string;
      status: string;
      reason?: string;
      message?: string;
    }>;
  };
}

class FleetAPI {
  async list(controlPlaneId: string): Promise<GameServerFleet[]> {
    const res = await fetch(`/api/proxy/api/v1/gameserverfleets`, {
      headers: { "X-Control-Plane-Id": controlPlaneId },
    });
    if (!res.ok) throw new Error("Failed to fetch fleets");
    return res.json();
  }

  async get(
    controlPlaneId: string,
    namespace: string,
    name: string
  ): Promise<GameServerFleet> {
    const res = await fetch(
      `/api/proxy/api/v1/gameserverfleets/${namespace}/${name}`,
      { headers: { "X-Control-Plane-Id": controlPlaneId } }
    );
    if (!res.ok) throw new Error("Failed to fetch fleet");
    return res.json();
  }

  async scale(
    controlPlaneId: string,
    namespace: string,
    name: string,
    replicas: number
  ): Promise<void> {
    // For now, we'll use the update endpoint to scale
    const res = await fetch(
      `/api/proxy/api/v1/gameserverfleets/${namespace}/${name}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Control-Plane-Id": controlPlaneId,
        },
        body: JSON.stringify({ spec: { replicas } }),
      }
    );
    if (!res.ok) throw new Error("Failed to scale fleet");
  }
}

export const fleetAPI = new FleetAPI();
