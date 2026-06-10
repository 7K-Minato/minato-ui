"use client";

import { useState, useEffect } from "react";
import { Badge } from "7k-design-system/react";
import { controlPlaneAPI } from "@/lib/control-plane-api";
import Skeleton from "@/components/ui/Skeleton";

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
          className="mb-4 mono-label text-white/70 hover:text-white"
        >
          ← BACK TO PROFILES
        </button>

        <header className="mb-8">
          <h1 className="text-4xl font-black tracking-tightest">
            {selectedProfile.spec.displayName || selectedProfile.metadata.name}
          </h1>
          <p className="mt-1 mono-label text-white/70">{selectedProfile.metadata.name}</p>
        </header>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            <div className="border-2 border-white p-6 accent-border-top">
              <h2 className="mb-4 mono-label">IMAGE</h2>
              <code className="code-block">
                {selectedProfile.spec.image}
              </code>
            </div>

            <div className="border-2 border-white p-6 cyan-border-top">
              <h2 className="mb-4 mono-label">PORTS</h2>
              <div className="space-y-2">
                {selectedProfile.spec.ports.map((port) => (
                  <div
                    key={port.name}
                    className="flex items-center justify-between border border-white/20 px-4 py-2"
                  >
                    <span>{port.name}</span>
                    <span className="mono-label text-white/70">
                      {port.containerPort}/{port.protocol || "TCP"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {selectedProfile.spec.resources && (
              <div className="border-2 border-white p-6 grid-border-top">
                <h2 className="mb-4 mono-label">RESOURCES</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="mono-label text-white/70">REQUESTS</p>
                    <p>CPU: {selectedProfile.spec.resources.requests?.cpu || "-"}</p>
                    <p>MEMORY: {selectedProfile.spec.resources.requests?.memory || "-"}</p>
                  </div>
                  <div>
                    <p className="mono-label text-white/70">LIMITS</p>
                    <p>CPU: {selectedProfile.spec.resources.limits?.cpu || "-"}</p>
                    <p>MEMORY: {selectedProfile.spec.resources.limits?.memory || "-"}</p>
                  </div>
                </div>
              </div>
            )}

            {selectedProfile.spec.storage && (
              <div className="border-2 border-white p-6 line-border-top">
                <h2 className="mb-4 mono-label">STORAGE</h2>
                <p>MOUNT PATH: {selectedProfile.spec.storage.mountPath}</p>
                <p>DEFAULT SIZE: {selectedProfile.spec.storage.sizeDefault || "-"}</p>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="border-2 border-white p-6 accent-border-top">
              <h2 className="mb-4 mono-label">AGENT</h2>
              <code className="code-block">
                {selectedProfile.spec.agent?.image}
              </code>
              {selectedProfile.spec.agent?.version && (
                <p className="mt-2 mono-label text-white/70">
                  VERSION: {selectedProfile.spec.agent.version}
                </p>
              )}
            </div>

            <div className="border-2 border-white p-6 cyan-border-top">
              <h2 className="mb-4 mono-label">ACTIONS</h2>
              <div className="space-y-2">
                {selectedProfile.spec.actions?.map((action) => (
                  <div
                    key={action.name}
                    className="border border-white/20 px-4 py-2"
                  >
                    <p className="font-medium">{action.name}</p>
                    <p className="mono-label text-white/70">{action.description}</p>
                    <div className="mt-1 flex gap-2 mono-label text-white/50">
                      <span>{action.concurrency}</span>
                      {action.timeout && <span>• {action.timeout}</span>}
                    </div>
                  </div>
                )) || <p className="mono-label text-white/50">NO ACTIONS DEFINED</p>}
              </div>
            </div>

            <div className="border-2 border-white p-6 grid-border-top">
              <h2 className="mb-4 mono-label">CAPABILITIES</h2>
              <div className="flex flex-wrap gap-2">
                {selectedProfile.spec.capabilities?.files && (
                  <Badge variant="success">FILES</Badge>
                )}
                {selectedProfile.spec.capabilities?.sftp && (
                  <Badge variant="success">SFTP</Badge>
                )}
                {selectedProfile.spec.capabilities?.backup && (
                  <Badge variant="success">BACKUP</Badge>
                )}
                {selectedProfile.spec.capabilities?.restoreFromSnapshot && (
                  <Badge variant="success">RESTORE</Badge>
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
          <h1 className="text-4xl font-black tracking-tightest">GAME PROFILES</h1>
          <p className="mt-1 mono-label text-white/70">BROWSE AVAILABLE GAME PROFILES</p>
        </div>
        <select
          className="border-2 border-white bg-black px-3 py-2 mono-label"
          value={selectedCP}
          onChange={(e) => setSelectedCP(e.target.value)}
        >
          {controlPlanes.map((cp) => (
            <option key={cp.id} value={cp.id}>{cp.name}</option>
          ))}
        </select>
      </header>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      ) : profiles.length === 0 ? (
        <div className="empty border-2 border-dashed border-white/50 p-8 text-center">
          <p className="mono-label text-white/50">NO PROFILES FOUND</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {profiles.map((profile) => (
            <button
              key={profile.metadata.name}
              onClick={() => setSelectedProfile(profile)}
              className="border-2 border-white p-6 text-left transition-colors hover:bg-white hover:text-black"
            >
              <h3 className="text-lg font-semibold">
                {profile.spec.displayName || profile.metadata.name}
              </h3>
              <p className="mt-1 mono-label text-white/70">{profile.metadata.name}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                <Badge variant="neutral">{profile.spec.ports.length} PORTS</Badge>
                <Badge variant="neutral">
                  {profile.spec.actions?.length || 0} ACTIONS
                </Badge>
              </div>

              <div className="mt-4 mono-label text-white/50">
                <p className="truncate">{profile.spec.image}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
