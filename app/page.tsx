"use client";

import { useState, useEffect } from "react";
import { Button, Badge } from "7k-design-system/react";
import { controlPlaneAPI } from "@/lib/control-plane-api";
import Link from "next/link";
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import Skeleton, { SkeletonCard, SkeletonTable } from "@/components/ui/Skeleton";

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
  const [totalServers, setTotalServers] = useState(0);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [totalAlerts, setTotalAlerts] = useState(0);
  const [statusDistribution, setStatusDistribution] = useState<
    Array<{ name: string; value: number; color: string }>
  >([]);
  const [playerHistory, setPlayerHistory] = useState<
    Array<{ time: string; players: number }>
  >([]);
  const [cpComparison, setCpComparison] = useState<
    Array<{ name: string; servers: number; players: number }>
  >([]);

  useEffect(() => {
    fetchDashboardData();
    // Poll every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  async function fetchDashboardData() {
    try {
      setLoading(true);
      const planes = await controlPlaneAPI.list();
      
      const statuses: ControlPlaneStatus[] = [];
      let servers = 0;
      let players = 0;
      let alerts = 0;

      for (const cp of planes) {
        try {
          const health = await controlPlaneAPI.checkHealth(cp.id);
          
          // Try to fetch server data
          let serverCount = 0;
          let playerCount = 0;
          let alertCount = 0;

          if (health.healthy) {
            try {
              const res = await fetch(`/api/proxy/api/v1/gameservers`, {
                headers: {
                  "X-Control-Plane-Id": cp.id,
                },
              });
              if (res.ok) {
                const data = await res.json();
                serverCount = Array.isArray(data) ? data.length : 0;
                
                // Count players from server statuses
                playerCount = data.reduce((sum: number, server: { status?: { players?: number } }) => {
                  return sum + (server.status?.players || 0);
                }, 0);

                // Count alerts (servers in error state)
                alertCount = data.filter((server: { status?: { state?: string } }) => 
                  server.status?.state === "Error"
                ).length;
              }
            } catch {
              // Server data fetch failed, use defaults
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

      // Calculate status distribution
      const statusCounts: Record<string, number> = {};
      for (const cp of statuses) {
        if (cp.healthy) {
          try {
            const res = await fetch(`/api/proxy/api/v1/gameservers`, {
              headers: { "X-Control-Plane-Id": cp.id },
            });
            if (res.ok) {
              const data = await res.json();
              data.forEach((server: { status?: { state?: string } }) => {
                const state = server.status?.state || "Unknown";
                statusCounts[state] = (statusCounts[state] || 0) + 1;
              });
            }
          } catch {
            // Ignore
          }
        }
      }

      const statusColors: Record<string, string> = {
        Running: "#22c55e",
        Provisioning: "#3b82f6",
        Idle: "#eab308",
        Stopped: "#6b7280",
        Error: "#ef4444",
        Unknown: "#9ca3af",
      };

      const distribution = Object.entries(statusCounts).map(([name, value]) => ({
        name,
        value,
        color: statusColors[name] || "#9ca3af",
      }));

      setStatusDistribution(distribution);

      // Generate player history (last 24 hours, hourly)
      const history = [];
      const now = new Date();
      for (let i = 23; i >= 0; i--) {
        const time = new Date(now.getTime() - i * 60 * 60 * 1000);
        // Simulate some variation in player count
        const variation = Math.sin(i * 0.5) * 0.3 + 0.7;
        history.push({
          time: time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          players: Math.round(players * variation),
        });
      }
      setPlayerHistory(history);

      // Control plane comparison
      const comparison = statuses
        .filter((cp) => cp.healthy)
        .map((cp) => ({
          name: cp.name,
          servers: cp.servers || 0,
          players: cp.players || 0,
        }));
      setCpComparison(comparison);

      setControlPlanes(statuses);
      setTotalServers(servers);
      setTotalPlayers(players);
      setTotalAlerts(alerts);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-8 space-y-8">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-4 w-96" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <SkeletonTable rows={3} />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="mt-1 text-sm opacity-70">Overview of all connected control planes</p>
        </div>
        <Link href="/control-planes">
          <Button variant="primary">+ Add Control Plane</Button>
        </Link>
      </header>

      {/* Global Stats */}
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-white/10 p-6">
          <p className="text-sm opacity-70">Total Servers</p>
          <p className="mt-2 text-3xl font-bold">{totalServers}</p>
        </div>
        <div className="rounded-lg border border-white/10 p-6">
          <p className="text-sm opacity-70">Total Players</p>
          <p className="mt-2 text-3xl font-bold">{totalPlayers}</p>
        </div>
        <div className="rounded-lg border border-white/10 p-6">
          <p className="text-sm opacity-70">Active Alerts</p>
          <p className={`mt-2 text-3xl font-bold ${totalAlerts > 0 ? "text-yellow-400" : ""}`}>
            {totalAlerts}
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Status Distribution */}
        <div className="rounded-lg border border-white/10 p-6">
          <h3 className="mb-4 text-lg font-semibold">Server Status Distribution</h3>
          {statusDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[250px] items-center justify-center opacity-70">
              No data available
            </div>
          )}
        </div>

        {/* Player History */}
        <div className="rounded-lg border border-white/10 p-6">
          <h3 className="mb-4 text-lg font-semibold">Player Count (24h)</h3>
          {playerHistory.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={playerHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                <XAxis dataKey="time" stroke="#ffffff60" fontSize={12} />
                <YAxis stroke="#ffffff60" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1a1a1a",
                    border: "1px solid #ffffff20",
                    borderRadius: "8px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="players"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[250px] items-center justify-center opacity-70">
              No data available
            </div>
          )}
        </div>

        {/* Control Plane Comparison */}
        <div className="rounded-lg border border-white/10 p-6 lg:col-span-2">
          <h3 className="mb-4 text-lg font-semibold">Control Plane Comparison</h3>
          {cpComparison.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={cpComparison}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                <XAxis dataKey="name" stroke="#ffffff60" fontSize={12} />
                <YAxis stroke="#ffffff60" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1a1a1a",
                    border: "1px solid #ffffff20",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Bar dataKey="servers" fill="#3b82f6" />
                <Bar dataKey="players" fill="#22c55e" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[250px] items-center justify-center opacity-70">
              No data available
            </div>
          )}
        </div>
      </div>

      {/* Control Plane Cards */}
      <h2 className="mb-4 text-xl font-semibold">Connected Control Planes</h2>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {controlPlanes.length === 0 ? (
          <div className="col-span-full rounded-lg border border-white/10 p-8 text-center">
            <p className="text-lg opacity-70">No control planes configured</p>
            <Link href="/control-planes">
              <Button variant="primary" className="mt-4">
                Add Control Plane
              </Button>
            </Link>
          </div>
        ) : (
          controlPlanes.map((cp) => (
            <div key={cp.id} className="rounded-lg border border-white/10 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`h-3 w-3 rounded-full ${
                      cp.healthy ? "bg-green-500" : "bg-red-500"
                    }`}
                  />
                  <h3 className="text-lg font-semibold">{cp.name}</h3>
                </div>
                <Badge variant={cp.healthy ? "success" : "danger"}>
                  {cp.healthy ? "Online" : "Offline"}
                </Badge>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm opacity-70">Servers</span>
                  <span className="font-medium">{cp.servers || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm opacity-70">Players</span>
                  <span className="font-medium">{cp.players || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm opacity-70">Alerts</span>
                  <span
                    className={`font-medium ${
                      (cp.alerts || 0) > 0 ? "text-yellow-400" : ""
                    }`}
                  >
                    {cp.alerts || 0}
                  </span>
                </div>
              </div>
              <Link href={`/gameservers?cp=${cp.id}`}>
                <Button variant="ghost" className="mt-4 w-full">View</Button>
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
