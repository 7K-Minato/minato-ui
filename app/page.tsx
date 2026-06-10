"use client";

import { useState, useEffect } from "react";
import { Button, Badge } from "7k-design-system/react";
import { controlPlaneAPI } from "@/lib/control-plane-api";
import Link from "next/link";
import Skeleton, { SkeletonCard } from "@/components/ui/Skeleton";

interface ControlPlaneStatus {
  id: string;
  name: string;
  url: string;
  healthy: boolean;
  servers?: number;
  players?: number;
  alerts?: number;
}

export default function DashboardPage() {
  const [controlPlanes, setControlPlanes] = useState<ControlPlaneStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [totalServers, setTotalServers] = useState(0);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [totalAlerts, setTotalAlerts] = useState(0);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  async function fetchDashboardData() {
    try {
      setLoading(true);
      setError("");
      const planes = await controlPlaneAPI.list();
      
      const statuses: ControlPlaneStatus[] = [];
      let servers = 0;
      let players = 0;
      let alerts = 0;

      for (const cp of planes) {
        try {
          const health = await controlPlaneAPI.checkHealth(cp.id);
          let serverCount = 0;
          let playerCount = 0;
          let alertCount = 0;

          if (health.healthy) {
            try {
              const res = await fetch(`/api/proxy/api/v1/gameservers`, {
                headers: { "X-Control-Plane-Id": cp.id },
              });
              if (res.ok) {
                const data = await res.json();
                serverCount = Array.isArray(data) ? data.length : 0;
                playerCount = data.reduce((sum: number, server: { status?: { players?: number } }) => {
                  return sum + (server.status?.players || 0);
                }, 0);
                alertCount = data.filter((server: { status?: { state?: string } }) => 
                  server.status?.state === "Error"
                ).length;
              }
            } catch {
              // Server data fetch failed
            }
          }

          statuses.push({
            id: cp.id,
            name: cp.name,
            url: cp.url,
            healthy: health.healthy,
            servers: serverCount,
            players: playerCount,
            alerts: alertCount,
          });

          servers += serverCount;
          players += playerCount;
          alerts += alertCount;
        } catch {
          statuses.push({
            id: cp.id,
            name: cp.name,
            url: cp.url,
            healthy: false,
            servers: 0,
            players: 0,
            alerts: 0,
          });
        }
      }

      setControlPlanes(statuses);
      setTotalServers(servers);
      setTotalPlayers(players);
      setTotalAlerts(alerts);
    } catch (err) {
      setError("Failed to fetch dashboard data");
      console.error("Failed to fetch dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading && controlPlanes.length === 0) {
    return (
      <div className="container mx-auto p-8 space-y-8">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-4 w-96" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tightest">DASHBOARD</h1>
          <p className="mt-1 mono-label text-white/70">OVERVIEW OF ALL CONNECTED CONTROL PLANES</p>
        </div>
        <Link href="/control-planes">
          <Button variant="glow">+ ADD CONTROL PLANE</Button>
        </Link>
      </header>

      {error && (
        <div className="glitch mb-8 border-2 border-white bg-black p-4">
          <span className="text-white">{error}</span>
        </div>
      )}

      {/* Global Stats */}
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="stat-accent border-2 border-white p-6 accent-border-top">
          <p className="mono-label text-white/70">TOTAL SERVERS</p>
          <p className="mt-2 text-4xl font-black" style={{ fontFamily: "var(--font-geist-mono)" }}>{totalServers}</p>
        </div>
        <div className="stat-accent border-2 border-white p-6 cyan-border-top">
          <p className="mono-label text-white/70">TOTAL PLAYERS</p>
          <p className="mt-2 text-4xl font-black" style={{ fontFamily: "var(--font-geist-mono)" }}>{totalPlayers}</p>
        </div>
        <div className={`stat-accent border-2 border-white p-6 ${totalAlerts > 0 ? "line-border-top" : ""}`}>
          <p className="mono-label text-white/70">ACTIVE ALERTS</p>
          <p className={`mt-2 text-4xl font-black ${totalAlerts > 0 ? "text-ember" : ""}`} style={{ fontFamily: "var(--font-geist-mono)" }}>{totalAlerts}</p>
        </div>
      </div>

      {/* Control Plane Cards */}
      <h2 className="mb-4 mono-label">CONNECTED CONTROL PLANES</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {controlPlanes.length === 0 ? (
          <div className="col-span-full empty border-2 border-dashed border-white/50 p-8 text-center">
            <p className="mono-label text-white/50">NO CONTROL PLANES CONFIGURED</p>
            <Link href="/control-planes">
              <Button variant="glow" className="mt-4">
                ADD CONTROL PLANE
              </Button>
            </Link>
          </div>
        ) : (
          controlPlanes.map((cp) => (
            <div key={cp.id} className={`border-2 border-white p-6 ${cp.healthy ? "glow-mod" : ""}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`status-dot ${cp.healthy ? "live" : "offline"}`} />
                  <h3 className="text-lg font-semibold">{cp.name}</h3>
                </div>
                <Badge variant={cp.healthy ? "success" : "danger"}>
                  {cp.healthy ? "ONLINE" : "OFFLINE"}
                </Badge>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="mono-label text-white/70">SERVERS</span>
                  <span className="font-medium">{cp.servers || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="mono-label text-white/70">PLAYERS</span>
                  <span className="font-medium">{cp.players || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="mono-label text-white/70">ALERTS</span>
                  <span className={`font-medium ${(cp.alerts || 0) > 0 ? "text-ember" : ""}`}>
                    {cp.alerts || 0}
                  </span>
                </div>
              </div>
              <Link href={`/gameservers?cp=${cp.id}`}>
                <Button variant="ghost" className="mt-4 w-full">VIEW</Button>
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
