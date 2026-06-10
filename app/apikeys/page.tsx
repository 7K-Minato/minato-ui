"use client";

import { useState, useEffect } from "react";
import { Button, Badge, Input } from "7k-design-system/react";
import { controlPlaneAPI } from "@/lib/control-plane-api";
import { useToastStore } from "@/components/ui/Toast";
import Skeleton from "@/components/ui/Skeleton";

interface APIKey {
  name: string;
  role: string;
  createdAt: string;
  createdBy?: string;
}

export default function APIKeysPage() {
  const [controlPlanes, setControlPlanes] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedCP, setSelectedCP] = useState<string>("");
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newKey, setNewKey] = useState<{
    name: string;
    role: string;
    keyValue?: string;
  } | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    role: "viewer",
  });
  const { addToast } = useToastStore();

  useEffect(() => {
    loadControlPlanes();
  }, []);

  useEffect(() => {
    if (selectedCP) loadAPIKeys();
  }, [selectedCP]);

  async function loadControlPlanes() {
    try {
      const cps = await controlPlaneAPI.list();
      setControlPlanes(cps.map((cp) => ({ id: cp.id, name: cp.name })));
      if (cps.length > 0) setSelectedCP(cps[0].id);
    } catch (error) {
      console.error("Failed to load control planes:", error);
    }
  }

  async function loadAPIKeys() {
    try {
      setLoading(true);
      const res = await fetch(`/api/proxy/api/v1/apikeys`, {
        headers: { "X-Control-Plane-Id": selectedCP },
      });
      if (res.ok) {
        const data = await res.json();
        setApiKeys(data);
      }
    } catch (error) {
      console.error("Failed to load API keys:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch(`/api/proxy/api/v1/apikeys`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Control-Plane-Id": selectedCP,
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const data = await res.json();
        setNewKey(data);
        setShowForm(false);
        setFormData({ name: "", role: "viewer" });
        loadAPIKeys();
        addToast("API key created", "success");
      } else {
        addToast("Failed to create API key", "error");
      }
    } catch (error) {
      console.error("Failed to create API key:", error);
      addToast("Failed to create API key", "error");
    }
  }

  async function handleDelete(keyName: string) {
    if (!confirm(`Are you sure you want to revoke "${keyName}"?`)) return;

    try {
      const res = await fetch(`/api/proxy/api/v1/apikeys/${keyName}`, {
        method: "DELETE",
        headers: { "X-Control-Plane-Id": selectedCP },
      });

      if (res.ok) {
        loadAPIKeys();
        addToast("API key revoked", "success");
      } else {
        addToast("Failed to revoke API key", "error");
      }
    } catch (error) {
      console.error("Failed to revoke API key:", error);
      addToast("Failed to revoke API key", "error");
    }
  }

  return (
    <div className="container mx-auto p-8">
      <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tightest">API KEYS</h1>
          <p className="mt-1 mono-label text-white/70">MANAGE API KEYS FOR SERVICE-TO-SERVICE AUTHENTICATION</p>
        </div>
        <div className="flex gap-4">
          <select
            className="border-2 border-white bg-black px-3 py-2 mono-label"
            value={selectedCP}
            onChange={(e) => setSelectedCP(e.target.value)}
          >
            {controlPlanes.map((cp) => (
              <option key={cp.id} value={cp.id}>
                {cp.name}
              </option>
            ))}
          </select>
          <Button variant="glow" onClick={() => setShowForm(!showForm)}>
            {showForm ? "CANCEL" : "+ CREATE KEY"}
          </Button>
        </div>
      </header>

      {newKey?.keyValue && (
        <div className="mb-6 border-2 border-white bg-black p-6">
          <h3 className="mb-2 mono-label text-status-warning">API KEY CREATED</h3>
          <p className="mb-4 mono-label text-white/70">
            COPY THIS KEY NOW. IT WILL NEVER BE SHOWN AGAIN.
          </p>
          <div className="flex gap-2">
            <code className="kbd flex-1 break-all px-4 py-2">
              {newKey.keyValue}
            </code>
            <Button
              variant="secondary"
              onClick={() => {
                navigator.clipboard.writeText(newKey.keyValue || "");
                addToast("Copied to clipboard", "success");
              }}
            >
              COPY
            </Button>
          </div>
          <Button variant="ghost" className="mt-4" onClick={() => setNewKey(null)}>
            DISMISS
          </Button>
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mb-8 border-2 border-white p-6"
        >
          <h3 className="mb-4 mono-label">CREATE API KEY</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mono-label block mb-1">NAME</label>
              <Input
                value={formData.name}
                onChange={(value) => setFormData({ ...formData, name: value })}
                placeholder="ci-cd-pipeline"
                required
              />
            </div>
            <div>
              <label className="mono-label block mb-1">ROLE</label>
              <select
                className="w-full border-2 border-white bg-black px-3 py-2 mono-label"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="viewer">VIEWER</option>
                <option value="operator">OPERATOR</option>
                <option value="admin">ADMIN</option>
              </select>
            </div>
          </div>
          <Button type="submit" variant="glow" className="mt-4">
            CREATE API KEY
          </Button>
        </form>
      )}

      <div className="border-2 border-white">
        <table className="table w-full">
          <thead>
            <tr>
              <th className="px-4 py-3">NAME</th>
              <th className="px-4 py-3">ROLE</th>
              <th className="px-4 py-3">CREATED</th>
              <th className="px-4 py-3">CREATED BY</th>
              <th className="px-4 py-3">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-white">
            {loading && apiKeys.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center">
                  <Skeleton className="h-8" />
                </td>
              </tr>
            ) : apiKeys.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center mono-label text-white/50">
                  NO API KEYS FOUND
                </td>
              </tr>
            ) : (
              apiKeys.map((key) => (
                <tr key={key.name}>
                  <td className="px-4 py-3 font-medium">{key.name}</td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={
                        key.role === "admin"
                          ? "danger"
                          : key.role === "operator"
                          ? "warning"
                          : "neutral"
                      }
                    >
                      {key.role.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 mono-label text-white/70">
                    {key.createdAt ? new Date(key.createdAt).toLocaleDateString() : "-"}
                  </td>
                  <td className="px-4 py-3 mono-label text-white/70">
                    {key.createdBy || "-"}
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(key.name)}
                    >
                      REVOKE
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
