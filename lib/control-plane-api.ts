import { ControlPlane } from "@prisma/client";

export interface ControlPlaneInput {
  name: string;
  url: string;
  authType: string;
  credentials?: Record<string, string>;
  isDefault?: boolean;
}

export interface HealthCheckResult {
  id: string;
  name: string;
  url: string;
  healthy: boolean;
  latency: number;
  authConfig?: {
    authModes: string[];
    oidcIssuer?: string;
    basicEnabled: boolean;
  };
  version: string;
}

class ControlPlaneAPI {
  async list(): Promise<Omit<ControlPlane, "credentials">[]> {
    const res = await fetch("/api/control-planes");
    if (!res.ok) throw new Error("Failed to fetch control planes");
    return res.json();
  }

  async get(id: string): Promise<Omit<ControlPlane, "credentials">> {
    const res = await fetch(`/api/control-planes/${id}`);
    if (!res.ok) throw new Error("Failed to fetch control plane");
    return res.json();
  }

  async create(data: ControlPlaneInput): Promise<Omit<ControlPlane, "credentials">> {
    const res = await fetch("/api/control-planes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create control plane");
    return res.json();
  }

  async update(
    id: string,
    data: Partial<ControlPlaneInput>
  ): Promise<Omit<ControlPlane, "credentials">> {
    const res = await fetch(`/api/control-planes/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update control plane");
    return res.json();
  }

  async delete(id: string): Promise<void> {
    const res = await fetch(`/api/control-planes/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete control plane");
  }

  async checkHealth(id: string): Promise<HealthCheckResult> {
    const res = await fetch(`/api/control-planes/${id}/health`, {
      method: "POST",
    });
    if (!res.ok) throw new Error("Failed to check health");
    return res.json();
  }
}

export const controlPlaneAPI = new ControlPlaneAPI();