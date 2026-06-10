"use client";

import { useState, useEffect } from "react";
import { Button, Input, Badge } from "7k-design-system/react";
import { controlPlaneAPI, HealthCheckResult } from "@/lib/control-plane-api";
import Link from "next/link";

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
      const data = await controlPlaneAPI.list();
      setControlPlanes(data);
      
      // Check health for all control planes
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
      alert("Failed to create control plane");
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
      alert("Failed to delete control plane");
    }
  }

  async function handleSetDefault(id: string) {
    try {
      await controlPlaneAPI.update(id, { isDefault: true });
      fetchControlPlanes();
    } catch (error) {
      console.error("Failed to set default:", error);
      alert("Failed to set default control plane");
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-8">
        <div className="flex items-center justify-center h-64">
          <p>Loading control planes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Control Planes</h1>
          <p className="mt-1 text-sm opacity-70">Manage your minato control plane connections</p>
        </div>
        <Button variant="primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "+ Add Control Plane"}
        </Button>
      </header>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-8 rounded-lg border border-white/10 p-6"
        >
          <h3 className="mb-4 text-lg font-semibold">Add Control Plane</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Production EU"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">URL</label>
              <Input
                type="url"
                value={formData.url}
                onChange={(e) =>
                  setFormData({ ...formData, url: e.target.value })
                }
                placeholder="http://localhost:8080"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Auth Type</label>
              <select
                className="w-full rounded border border-white/10 bg-transparent px-3 py-2"
                value={formData.authType}
                onChange={(e) =>
                  setFormData({ ...formData, authType: e.target.value })
                }
              >
                <option value="basic">Basic Auth</option>
                <option value="oidc">OIDC</option>
                <option value="apikey">API Key</option>
              </select>
            </div>
            {formData.authType === "basic" && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">Username</label>
                  <Input
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                    placeholder="admin"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Password</label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
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
              className="rounded border-white/10"
            />
            <label htmlFor="isDefault" className="text-sm">
              Set as default
            </label>
          </div>
          <div className="mt-4">
            <Button type="submit" variant="primary">
              Add Control Plane
            </Button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {controlPlanes.length === 0 ? (
          <div className="rounded-lg border border-white/10 p-8 text-center">
            <p className="text-lg opacity-70">No control planes configured</p>
            <p className="mt-2 text-sm opacity-50">
              Add your first control plane to get started
            </p>
          </div>
        ) : (
          controlPlanes.map((cp) => {
            const health = healthStatus[cp.id];
            return (
              <div
                key={cp.id}
                className="rounded-lg border border-white/10 p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-3 w-3 rounded-full ${
                        health?.healthy ? "bg-green-500" : "bg-red-500"
                      }`}
                    />
                    <div>
                      <h3 className="text-lg font-semibold">{cp.name}</h3>
                      <p className="text-sm opacity-70">{cp.url}</p>
                    </div>
                    {cp.isDefault && (
                      <Badge variant="info">Default</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {!cp.isDefault && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSetDefault(cp.id)}
                      >
                        Set Default
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(cp.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>

                {health && (
                  <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="opacity-70">Status: </span>
                      <span
                        className={
                          health.healthy ? "text-green-400" : "text-red-400"
                        }
                      >
                        {health.healthy ? "Online" : "Offline"}
                      </span>
                    </div>
                    <div>
                      <span className="opacity-70">Latency: </span>
                      <span>
                        {health.latency >= 0
                          ? `${health.latency}ms`
                          : "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="opacity-70">Version: </span>
                      <span>{health.version}</span>
                    </div>
                  </div>
                )}

                {health?.authConfig && (
                  <div className="mt-2 text-sm">
                    <span className="opacity-70">Auth Modes: </span>
                    <span>{health.authConfig.authModes.join(", ")}</span>
                  </div>
                )}

                <div className="mt-4 flex gap-2">
                  <Link href={`/?cp=${cp.id}`}>
                    <Button variant="primary" size="sm">
                      Connect
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
