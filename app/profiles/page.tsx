"use client";

import { useState, useEffect } from "react";
import { Badge } from "7k-design-system/react";
import { controlPlaneAPI } from "@/lib/control-plane-api";

interface GameProfile {
  apiVersion: string;
  kind: string;
  metadata: {
    name: string;
  };
  spec: {
    displayName?: string;
    image: string;
    ports: Array<{
      name: string;
      containerPort: number;
      protocol?: string;
    }>;
    environment?: Array<{
      key: string;
      default?: string;
      required?: boolean;
    }>;
    resources?: {
      requests?: { cpu?: string; memory?: string };
      limits?: { cpu?: string; memory?: string };
    };
    storage?: {
      mountPath: string;
      sizeDefault?: string;
    };
    agent?: {
      image: string;
      version?: string;
    };
    actions?: Array<{
      name: string;
      description: string;
      concurrency: string;
      timeout?: string;
    }>;
    capabilities?: {
      files?: boolean;
      sftp?: boolean;
      backup?: boolean;
      restoreFromSnapshot?: boolean;
    };
  };
}

export default function ProfilesPage() {
  const [controlPlanes, setControlPlanes] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedCP, setSelectedCP] = useState<string>("");
  const [profiles, setProfiles] = useState<GameProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState<GameProfile | null>(null);

  useEffect(() => {
    loadControlPlanes();
  }, []);

  useEffect(() => {
    if (selectedCP) loadProfiles();
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

  async function loadProfiles() {
    try {
      setLoading(true);
      const res = await fetch(`/api/proxy/api/v1/profiles`, {
        headers: { "X-Control-Plane-Id": selectedCP },
      });
      if (res.ok) {
        const data = await res.json();
        setProfiles(data);
      }
    } catch (error) {
      console.error("Failed to load profiles:", error);
    } finally {
      setLoading(false);
    }
  }

  if (selectedProfile) {
    return (
      <div className="container mx-auto p-8">
        <button
          onClick={() => setSelectedProfile(null)}
          className="mb-4 text-sm opacity-70 hover:opacity-100"
        >
          ← Back to profiles
        </button>

        <header className="mb-8">
          <h1 className="text-3xl font-bold">
            {selectedProfile.spec.displayName || selectedProfile.metadata.name}
          </h1>
          <p className="mt-1 text-sm opacity-70">{selectedProfile.metadata.name}</p>
        </header>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            <div className="rounded-lg border border-white/10 p-6">
              <h2 className="mb-4 text-lg font-semibold">Image</h2>
              <code className="rounded bg-white/5 px-3 py-2 text-sm">
                {selectedProfile.spec.image}
              </code>
            </div>

            <div className="rounded-lg border border-white/10 p-6">
              <h2 className="mb-4 text-lg font-semibold">Ports</h2>
              <div className="space-y-2">
                {selectedProfile.spec.ports.map((port) => (
                  <div
                    key={port.name}
                    className="flex items-center justify-between rounded bg-white/5 px-4 py-2"
                  >
                    <span>{port.name}</span>
                    <span className="text-sm opacity-70">
                      {port.containerPort}/{port.protocol || "TCP"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {selectedProfile.spec.resources && (
              <div className="rounded-lg border border-white/10 p-6">
                <h2 className="mb-4 text-lg font-semibold">Resources</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm opacity-70">Requests</p>
                    <p>CPU: {selectedProfile.spec.resources.requests?.cpu || "-"}</p>
                    <p>Memory: {selectedProfile.spec.resources.requests?.memory || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm opacity-70">Limits</p>
                    <p>CPU: {selectedProfile.spec.resources.limits?.cpu || "-"}</p>
                    <p>Memory: {selectedProfile.spec.resources.limits?.memory || "-"}</p>
                  </div>
                </div>
              </div>
            )}

            {selectedProfile.spec.storage && (
              <div className="rounded-lg border border-white/10 p-6">
                <h2 className="mb-4 text-lg font-semibold">Storage</h2>
                <p>Mount Path: {selectedProfile.spec.storage.mountPath}</p>
                <p>Default Size: {selectedProfile.spec.storage.sizeDefault || "-"}</p>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="rounded-lg border border-white/10 p-6">
              <h2 className="mb-4 text-lg font-semibold">Agent</h2>
              <code className="rounded bg-white/5 px-3 py-2 text-sm">
                {selectedProfile.spec.agent?.image}
              </code>
              {selectedProfile.spec.agent?.version && (
                <p className="mt-2 text-sm opacity-70">
                  Version: {selectedProfile.spec.agent.version}
                </p>
              )}
            </div>

            <div className="rounded-lg border border-white/10 p-6">
              <h2 className="mb-4 text-lg font-semibold">Actions</h2>
              <div className="space-y-2">
                {selectedProfile.spec.actions?.map((action) => (
                  <div
                    key={action.name}
                    className="rounded bg-white/5 px-4 py-2"
                  >
                    <p className="font-medium">{action.name}</p>
                    <p className="text-sm opacity-70">{action.description}</p>
                    <div className="mt-1 flex gap-2 text-xs opacity-50">
                      <span>{action.concurrency}</span>
                      {action.timeout && <span>• {action.timeout}</span>}
                    </div>
                  </div>
                )) || <p className="opacity-70">No actions defined</p>}
              </div>
            </div>

            <div className="rounded-lg border border-white/10 p-6">
              <h2 className="mb-4 text-lg font-semibold">Capabilities</h2>
              <div className="flex flex-wrap gap-2">
                {selectedProfile.spec.capabilities?.files && (
                  <Badge variant="success">Files</Badge>
                )}
                {selectedProfile.spec.capabilities?.sftp && (
                  <Badge variant="success">SFTP</Badge>
                )}
                {selectedProfile.spec.capabilities?.backup && (
                  <Badge variant="success">Backup</Badge>
                )}
                {selectedProfile.spec.capabilities?.restoreFromSnapshot && (
                  <Badge variant="success">Restore</Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Game Profiles</h1>
          <p className="mt-1 text-sm opacity-70">Browse available game profiles</p>
        </div>
        <select
          className="rounded border border-white/10 bg-transparent px-3 py-2"
          value={selectedCP}
          onChange={(e) => setSelectedCP(e.target.value)}
        >
          {controlPlanes.map((cp) => (
            <option key={cp.id} value={cp.id}>{cp.name}</option>
          ))}
        </select>
      </header>

      {loading ? (
        <p>Loading profiles...</p>
      ) : profiles.length === 0 ? (
        <div className="rounded-lg border border-white/10 p-8 text-center">
          <p className="opacity-70">No profiles found</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {profiles.map((profile) => (
            <button
              key={profile.metadata.name}
              onClick={() => setSelectedProfile(profile)}
              className="rounded-lg border border-white/10 p-6 text-left transition-colors hover:bg-white/5"
            >
              <h3 className="text-lg font-semibold">
                {profile.spec.displayName || profile.metadata.name}
              </h3>
              <p className="mt-1 text-sm opacity-70">{profile.metadata.name}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                <Badge variant="default">{profile.spec.ports.length} ports</Badge>
                <Badge variant="default">
                  {profile.spec.actions?.length || 0} actions
                </Badge>
              </div>

              <div className="mt-4 text-xs opacity-50">
                <p className="truncate">{profile.spec.image}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
