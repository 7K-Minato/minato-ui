"use client";

import { useState, useEffect, useCallback } from "react";
import { Button, Badge, Input } from "7k-design-system/react";
import { fleetAPI, GameServerFleet } from "@/lib/fleet-api";
import { controlPlaneAPI } from "@/lib/control-plane-api";
import Skeleton from "@/components/ui/Skeleton";

export default function FleetsPage() {
  const [controlPlanes, setControlPlanes] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedCP, setSelectedCP] = useState<string>("");
  const [fleets, setFleets] = useState<GameServerFleet[]>([]);
  const [filteredFleets, setFilteredFleets] = useState<GameServerFleet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [scaling, setScaling] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadControlPlanes();
  }, []);

  useEffect(() => {
    if (selectedCP) loadFleets();
  }, [selectedCP]);

  useEffect(() => {
    if (!search) {
      setFilteredFleets(fleets);
    } else {
      const s = search.toLowerCase();
      setFilteredFleets(
        fleets.filter(
          (f) =>
            f.metadata.name.toLowerCase().includes(s) ||
            f.metadata.namespace.toLowerCase().includes(s) ||
            f.spec.profile.toLowerCase().includes(s)
        )
      );
    }
  }, [fleets, search]);

  async function loadControlPlanes() {
    try {
      const cps = await controlPlaneAPI.list();
      setControlPlanes(cps.map((cp) => ({ id: cp.id, name: cp.name })));
      if (cps.length > 0) setSelectedCP(cps[0].id);
    } catch (error) {
      console.error("Failed to load control planes:", error);
    }
  }

  const loadFleets = useCallback(async () => {
    if (!selectedCP) return;
    try {
      setLoading(true);
      setError("");
      const data = await fleetAPI.list(selectedCP);
      setFleets(data);
    } catch (error) {
      console.error("Failed to load fleets:", error);
      setError("Failed to load fleets");
      setFleets([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCP]);

  async function handleScale(namespace: string, name: string, replicas: number) {
    try {
      setScaling({ ...scaling, [`${namespace}/${name}`]: true });
      await fleetAPI.scale(selectedCP, namespace, name, replicas);
      loadFleets();
    } catch (error) {
      console.error("Failed to scale fleet:", error);
      setError("Failed to scale fleet");
    } finally {
      setScaling({ ...scaling, [`${namespace}/${name}`]: false });
    }
  }

  useEffect(() => {
    if (!selectedCP) return;
    const interval = setInterval(loadFleets, 10000);
    return () => clearInterval(interval);
  }, [selectedCP, loadFleets]);

  return (
    <div className="container mx-auto p-8">
      <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tightest">FLEETS</h1>
          <p className="mt-1 mono-label text-white/70">MANAGE GAME SERVER FLEETS</p>
        </div>
        <div className="flex gap-4">
          <select
            className="border-2 border-white bg-black px-3 py-2 mono-label"
            value={selectedCP}
            onChange={(e) => setSelectedCP(e.target.value)}
          >
            {controlPlanes.map((cp) => (
              <option key={cp.id} value={cp.id}>{cp.name}</option>
            ))}
          </select>
        </div>
      </header>

      {error && (
        <div className="glitch mb-6 border-2 border-white bg-black p-4">
          <span className="text-white">{error}</span>
        </div>
      )}

      <Input
        placeholder="SEARCH FLEETS..."
        value={search}
        onChange={setSearch}
        className="mb-6"
      />

      <div className="space-y-4">
        {loading && fleets.length === 0 ? (
          <div className="space-y-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        ) : filteredFleets.length === 0 ? (
          <div className="empty border-2 border-dashed border-white/50 p-8 text-center">
            <p className="mono-label text-white/50">NO FLEETS FOUND</p>
          </div>
        ) : (
          filteredFleets.map((fleet) => {
            const status = fleet.status;
            const ready = status?.readyReplicas || 0;
            const desired = fleet.spec.replicas;
            const key = `${fleet.metadata.namespace}/${fleet.metadata.name}`;

            return (
              <div key={key} className="border-2 border-white p-6 accent-border-top">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold">{fleet.metadata.name}</h3>
                      <Badge variant="neutral">{fleet.spec.profile}</Badge>
                    </div>
                    <p className="mt-1 mono-label text-white/70">{fleet.metadata.namespace}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-4xl font-black" style={{ fontFamily: "var(--font-geist-mono)" }}>
                      {ready}/{desired}
                    </p>
                    <p className="mono-label text-white/70">REPLICAS READY</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-4">
                  <div className="progress">
                    <div
                      className="progress-accent"
                      style={{
                        width: `${desired > 0 ? (ready / desired) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Scaling Controls */}
                <div className="mt-4 flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      handleScale(
                        fleet.metadata.namespace,
                        fleet.metadata.name,
                        Math.max(0, desired - 1)
                      )
                    }
                    disabled={scaling[key] || desired <= 0}
                  >
                    -
                  </Button>
                  <span className="w-12 text-center font-medium">{desired}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      handleScale(
                        fleet.metadata.namespace,
                        fleet.metadata.name,
                        desired + 1
                      )
                    }
                    disabled={scaling[key]}
                  >
                    +
                  </Button>

                  {status?.updatedReplicas !== status?.replicas && (
                    <Badge variant="info" className="ml-4">
                      UPDATING ({status?.updatedReplicas || 0}/{desired})
                    </Badge>
                  )}
                </div>

                {/* Conditions */}
                {status?.conditions && status.conditions.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {status.conditions.map((c) => (
                      <Badge
                        key={c.type}
                        variant={c.status === "True" ? "success" : "warning"}
                        className="text-xs"
                      >
                        {c.type}: {c.status}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
