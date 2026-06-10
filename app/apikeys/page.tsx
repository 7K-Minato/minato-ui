"use client";

import { useState, useEffect } from "react";
import { Button, Badge, Input } from "7k-design-system/react";
import { controlPlaneAPI } from "@/lib/control-plane-api";

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
      } else {
        alert("Failed to create API key");
      }
    } catch (error) {
      console.error("Failed to create API key:", error);
      alert("Failed to create API key");
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
      } else {
        alert("Failed to revoke API key");
      }
    } catch (error) {
      console.error("Failed to revoke API key:", error);
      alert("Failed to revoke API key");
    }
  }

  return (
    <div className="container mx-auto p-8">
      <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">API Keys</h1>
          <p className="mt-1 text-sm opacity-70">Manage API keys for service-to-service authentication</p>
        </div>
        <div className="flex gap-4">
          <select
            className="rounded border border-white/10 bg-transparent px-3 py-2"
            value={selectedCP}
            onChange={(e) => setSelectedCP(e.target.value)}
          >
            {controlPlanes.map((cp) => (
              <option key={cp.id} value={cp.id}>
                {cp.name}
              </option>
            ))}
          </select>
          <Button variant="primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? "Cancel" : "+ Create Key"}
          </Button>
        </div>
      </header>

      {newKey?.keyValue && (
        <div className="mb-6 rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-6">
          <h3 className="mb-2 font-semibold text-yellow-400">API Key Created</h3>
          <p className="mb-4 text-sm">
            Copy this key now. It will never be shown again.
          </p>
          <div className="flex gap-2">
            <code className="flex-1 rounded bg-black/50 px-4 py-2 text-sm break-all">
              {newKey.keyValue}
            </code>
            <Button
              variant="secondary"
              onClick={() => navigator.clipboard.writeText(newKey.keyValue || "")}
            >
              Copy
            </Button>
          </div>
          <Button variant="ghost" className="mt-4" onClick={() => setNewKey(null)}>
            Dismiss
          </Button>
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mb-8 rounded-lg border border-white/10 p-6"
        >
          <h3 className="mb-4 text-lg font-semibold">Create API Key</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="ci-cd-pipeline"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Role</label>
              <select
                className="w-full rounded border border-white/10 bg-transparent px-3 py-2"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="viewer">Viewer</option>
                <option value="operator">Operator</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <Button type="submit" variant="primary" className="mt-4">
            Create API Key
          </Button>
        </form>
      )}

      <div className="rounded-lg border border-white/10">
        <table className="w-full">
          <thead className="border-b border-white/10">
            <tr className="text-left text-sm opacity-70">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Created By</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {loading && apiKeys.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center">
                  Loading API keys...
                </td>
              </tr>
            ) : apiKeys.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center opacity-70">
                  No API keys found
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
                          : "default"
                      }
                    >
                      {key.role}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm opacity-70">
                    {key.createdAt ? new Date(key.createdAt).toLocaleDateString() : "-"}
                  </td>
                  <td className="px-4 py-3 text-sm opacity-70">
                    {key.createdBy || "-"}
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(key.name)}
                    >
                      Revoke
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
