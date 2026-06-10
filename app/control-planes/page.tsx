"use client";

import { useState, useEffect } from "react";
import { Button, Input, Badge } from "7k-design-system/react";
import { controlPlaneAPI, HealthCheckResult } from "@/lib/control-plane-api";
import Link from "next/link";
import Skeleton from "@/components/ui/Skeleton";

interface ControlPlane {
  id: string;
  name: string;
  url: string;
  authType: string;
  isDefault: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export default function ControlPlanesPage() {
  const [controlPlanes, setControlPlanes] = useState<ControlPlane[]>([]);
  const [healthStatus, setHealthStatus] = useState<Record<string, HealthCheckResult>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    url: "",
    authType: "basic",
    username: "",
    password: "",
    isDefault: false,
  });

  useEffect(() => {
    fetchControlPlanes();
  }, []);

  async function fetchControlPlanes() {
    try {
      setLoading(true);
      setError("");
      const data = await controlPlaneAPI.list();
      setControlPlanes(data);
      
      const healthResults: Record<string, HealthCheckResult> = {};
      for (const cp of data) {
        try {
          const health = await controlPlaneAPI.checkHealth(cp.id);
          healthResults[cp.id] = health;
        } catch {
          healthResults[cp.id] = {
            id: cp.id,
            name: cp.name,
            url: cp.url,
            healthy: false,
            latency: -1,
            version: "unknown",
          };
        }
      }
      setHealthStatus(healthResults);
    } catch (error) {
      console.error("Failed to fetch control planes:", error);
      setError("Failed to fetch control planes");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const credentials =
        formData.authType === "basic"
          ? { username: formData.username, password: formData.password }
          : undefined;

      await controlPlaneAPI.create({
        name: formData.name,
        url: formData.url,
        authType: formData.authType,
        credentials,
        isDefault: formData.isDefault,
      });

      setShowForm(false);
      setFormData({
        name: "",
        url: "",
        authType: "basic",
        username: "",
        password: "",
        isDefault: false,
      });
      fetchControlPlanes();
    } catch (error) {
      console.error("Failed to create control plane:", error);
      setError("Failed to create control plane");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this control plane?")) {
      return;
    }

    try {
      await controlPlaneAPI.delete(id);
      fetchControlPlanes();
    } catch (error) {
      console.error("Failed to delete control plane:", error);
      setError("Failed to delete control plane");
    }
  }

  async function handleSetDefault(id: string) {
    try {
      await controlPlaneAPI.update(id, { isDefault: true });
      fetchControlPlanes();
    } catch (error) {
      console.error("Failed to set default:", error);
      setError("Failed to set default control plane");
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-8">
        <Skeleton className="h-10 w-64 mb-8" />
        <div className="space-y-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tightest">CONTROL PLANES</h1>
          <p className="mt-1 mono-label text-white/70">MANAGE YOUR MINATO CONTROL PLANE CONNECTIONS</p>
        </div>
        <Button variant="glow" onClick={() => setShowForm(!showForm)}>
          {showForm ? "CANCEL" : "+ ADD CONTROL PLANE"}
        </Button>
      </header>

      {error && (
        <div className="glitch mb-8 border-2 border-white bg-black p-4">
          <span className="text-white">{error}</span>
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-8 border-2 border-white p-6"
        >
          <h3 className="mb-4 mono-label">ADD CONTROL PLANE</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mono-label block mb-1">NAME</label>
              <Input
                value={formData.name}
                onChange={(value) =>
                  setFormData({ ...formData, name: value })
                }
                placeholder="Production EU"
                required
              />
            </div>
            <div>
              <label className="mono-label block mb-1">URL</label>
              <Input
                type="url"
                value={formData.url}
                onChange={(value) =>
                  setFormData({ ...formData, url: value })
                }
                placeholder="http://localhost:8080"
                required
              />
            </div>
            <div>
              <label className="mono-label block mb-1">AUTH TYPE</label>
              <select
                className="w-full border-2 border-white bg-black px-3 py-2 mono-label"
                value={formData.authType}
                onChange={(e) =>
                  setFormData({ ...formData, authType: e.target.value })
                }
              >
                <option value="basic">BASIC AUTH</option>
                <option value="oidc">OIDC</option>
                <option value="apikey">API KEY</option>
              </select>
            </div>
            {formData.authType === "basic" && (
              <>
                <div>
                  <label className="mono-label block mb-1">USERNAME</label>
                  <Input
                    value={formData.username}
                    onChange={(value) =>
                      setFormData({ ...formData, username: value })
                    }
                    placeholder="admin"
                  />
                </div>
                <div>
                  <label className="mono-label block mb-1">PASSWORD</label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(value) =>
                      setFormData({ ...formData, password: value })
                    }
                    placeholder="••••••••"
                  />
                </div>
              </>
            )}
          </div>
          <div className="mt-4 flex items-center gap-2">
            <input
              type="checkbox"
              id="isDefault"
              checked={formData.isDefault}
              onChange={(e) =>
                setFormData({ ...formData, isDefault: e.target.checked })
              }
              className="checkbox"
            />
            <label htmlFor="isDefault" className="mono-label">
              SET AS DEFAULT
            </label>
          </div>
          <div className="mt-4">
            <Button type="submit" variant="glow">
              ADD CONTROL PLANE
            </Button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {controlPlanes.length === 0 ? (
          <div className="empty border-2 border-dashed border-white/50 p-8 text-center">
            <p className="mono-label text-white/50">NO CONTROL PLANES CONFIGURED</p>
            <p className="mt-2 mono-label text-white/30">
              ADD YOUR FIRST CONTROL PLANE TO GET STARTED
            </p>
          </div>
        ) : (
          controlPlanes.map((cp) => {
            const health = healthStatus[cp.id];
            return (
              <div
                key={cp.id}
                className="border-2 border-white p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`status-dot ${health?.healthy ? "live" : "offline"}`} />
                    <div>
                      <h3 className="text-lg font-semibold">{cp.name}</h3>
                      <p className="mono-label text-white/70">{cp.url}</p>
                    </div>
                    {cp.isDefault && (
                      <Badge variant="info">DEFAULT</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {!cp.isDefault && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSetDefault(cp.id)}
                      >
                        SET DEFAULT
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(cp.id)}
                    >
                      DELETE
                    </Button>
                  </div>
                </div>

                {health && (
                  <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="mono-label text-white/70">STATUS: </span>
                      <span className={health.healthy ? "text-status-success" : "text-status-danger"}>
                        {health.healthy ? "ONLINE" : "OFFLINE"}
                      </span>
                    </div>
                    <div>
                      <span className="mono-label text-white/70">LATENCY: </span>
                      <span>
                        {health.latency >= 0
                          ? `${health.latency}ms`
                          : "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="mono-label text-white/70">VERSION: </span>
                      <span>{health.version}</span>
                    </div>
                  </div>
                )}

                {health?.authConfig && (
                  <div className="mt-2 text-sm">
                    <span className="mono-label text-white/70">AUTH MODES: </span>
                    <span>{health.authConfig.authModes.join(", ")}</span>
                  </div>
                )}

                <div className="mt-4 flex gap-2">
                  <Link href={`/?cp=${cp.id}`}>
                    <Button variant="glow" size="sm">
                      CONNECT
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
