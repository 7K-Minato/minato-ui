"use client";

import { useState, useEffect, useCallback } from "react";
import { Badge, Button } from "7k-design-system/react";
import { controlPlaneAPI } from "@/lib/control-plane-api";
import Skeleton from "@/components/ui/Skeleton";

interface AuditEvent {
  id: string;
  timestamp: string;
  level: string;
  actor: string;
  action: string;
  resource: string;
  resourceName: string;
  namespace?: string;
  details?: string;
  success: boolean;
}

export default function AuditLogsPage() {
  const [controlPlanes, setControlPlanes] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedCP, setSelectedCP] = useState<string>("");
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState({
    actor: "",
    action: "",
    resource: "",
    success: "",
  });

  useEffect(() => {
    loadControlPlanes();
  }, []);

  async function loadControlPlanes() {
    try {
      const cps = await controlPlaneAPI.list();
      setControlPlanes(cps.map((cp) => ({ id: cp.id, name: cp.name })));
      if (cps.length > 0) setSelectedCP(cps[0].id);
    } catch (error) {
      console.error("Failed to load control planes:", error);
    }
  }

  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams();
      if (filter.actor) params.append("actor", filter.actor);
      if (filter.action) params.append("action", filter.action);
      if (filter.resource) params.append("resource", filter.resource);
      if (filter.success) params.append("success", filter.success);

      const res = await fetch(`/api/proxy/api/v1/audit?${params}`, {
        headers: { "X-Control-Plane-Id": selectedCP },
      });

      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
      } else if (res.status === 404) {
        setError("Audit endpoint not configured");
      }
    } catch (error) {
      console.error("Failed to load audit events:", error);
      setError("Failed to load audit events");
    } finally {
      setLoading(false);
    }
  }, [selectedCP, filter]);

  useEffect(() => {
    if (selectedCP) loadEvents();
  }, [selectedCP, loadEvents]);

  const filteredEvents = events.filter((event) => {
    if (filter.actor && !event.actor?.toLowerCase().includes(filter.actor.toLowerCase())) return false;
    if (filter.action && !event.action?.toLowerCase().includes(filter.action.toLowerCase())) return false;
    if (filter.resource && !event.resource?.toLowerCase().includes(filter.resource.toLowerCase())) return false;
    if (filter.success && event.success.toString() !== filter.success) return false;
    return true;
  });

  return (
    <div className="container mx-auto p-8">
      <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tightest">AUDIT LOGS</h1>
          <p className="mt-1 mono-label text-white/70">VIEW AND FILTER AUDIT EVENTS ACROSS CONTROL PLANES</p>
        </div>
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
      </header>

      {error && (
        <div className="glitch mb-6 border-2 border-white bg-black p-4">
          <span className="text-white">{error}</span>
        </div>
      )}

      <div className="mb-6 border-2 border-white p-4">
        <div className="grid gap-3 md:grid-cols-5">
          <input
            type="text"
            placeholder="FILTER BY ACTOR..."
            className="border-2 border-white bg-black px-3 py-2 mono-label"
            value={filter.actor}
            onChange={(e) => setFilter({ ...filter, actor: e.target.value })}
          />
          <input
            type="text"
            placeholder="FILTER BY ACTION..."
            className="border-2 border-white bg-black px-3 py-2 mono-label"
            value={filter.action}
            onChange={(e) => setFilter({ ...filter, action: e.target.value })}
          />
          <input
            type="text"
            placeholder="FILTER BY RESOURCE..."
            className="border-2 border-white bg-black px-3 py-2 mono-label"
            value={filter.resource}
            onChange={(e) => setFilter({ ...filter, resource: e.target.value })}
          />
          <select
            className="border-2 border-white bg-black px-3 py-2 mono-label"
            value={filter.success}
            onChange={(e) => setFilter({ ...filter, success: e.target.value })}
          >
            <option value="">ALL STATUS</option>
            <option value="true">SUCCESS</option>
            <option value="false">FAILED</option>
          </select>
          <Button
            variant="secondary"
            onClick={loadEvents}
          >
            REFRESH
          </Button>
        </div>
      </div>

      <div className="border-2 border-white">
        <table className="table w-full">
          <thead>
            <tr>
              <th className="px-4 py-3">TIMESTAMP</th>
              <th className="px-4 py-3">LEVEL</th>
              <th className="px-4 py-3">ACTOR</th>
              <th className="px-4 py-3">ACTION</th>
              <th className="px-4 py-3">RESOURCE</th>
              <th className="px-4 py-3">NAME</th>
              <th className="px-4 py-3">STATUS</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-white">
            {loading && events.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8">
                  <Skeleton className="h-8" />
                </td>
              </tr>
            ) : filteredEvents.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center mono-label text-white/50">
                  {error ? "AUDIT ENDPOINT NOT CONFIGURED" : "NO AUDIT EVENTS FOUND"}
                </td>
              </tr>
            ) : (
              filteredEvents.map((event) => (
                <tr key={event.id} className="hover:bg-white/5">
                  <td className="px-4 py-3 whitespace-nowrap mono-label">
                    {new Date(event.timestamp).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={
                        event.level === "error"
                          ? "danger"
                          : event.level === "warn"
                          ? "warning"
                          : "neutral"
                      }
                    >
                      {event.level.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 font-medium">{event.actor}</td>
                  <td className="px-4 py-3 mono-label">{event.action}</td>
                  <td className="px-4 py-3 mono-label text-white/70">{event.resource}</td>
                  <td className="px-4 py-3">{event.resourceName}</td>
                  <td className="px-4 py-3">
                    <Badge variant={event.success ? "success" : "danger"}>
                      {event.success ? "SUCCESS" : "FAILED"}
                    </Badge>
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
