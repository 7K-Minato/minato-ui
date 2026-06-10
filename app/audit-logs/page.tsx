"use client";

import { useState, useEffect } from "react";
import { Badge } from "7k-design-system/react";
import { controlPlaneAPI } from "@/lib/control-plane-api";

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
  const [filter, setFilter] = useState({
    actor: "",
    action: "",
    resource: "",
    success: "",
  });

  useEffect(() => {
    loadControlPlanes();
  }, []);

  useEffect(() => {
    if (selectedCP) loadEvents();
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

  async function loadEvents() {
    try {
      setLoading(true);
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
      }
    } catch (error) {
      console.error("Failed to load audit events:", error);
    } finally {
      setLoading(false);
    }
  }

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
          <h1 className="text-3xl font-bold">Audit Logs</h1>
          <p className="mt-1 text-sm opacity-70">View and filter audit events across control planes</p>
        </div>
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
      </header>

      <div className="mb-6 rounded-lg border border-white/10 p-4">
        <div className="grid gap-3 md:grid-cols-5">
          <input
            type="text"
            placeholder="Filter by actor..."
            className="rounded border border-white/10 bg-transparent px-3 py-2 text-sm"
            value={filter.actor}
            onChange={(e) => setFilter({ ...filter, actor: e.target.value })}
          />
          <input
            type="text"
            placeholder="Filter by action..."
            className="rounded border border-white/10 bg-transparent px-3 py-2 text-sm"
            value={filter.action}
            onChange={(e) => setFilter({ ...filter, action: e.target.value })}
          />
          <input
            type="text"
            placeholder="Filter by resource..."
            className="rounded border border-white/10 bg-transparent px-3 py-2 text-sm"
            value={filter.resource}
            onChange={(e) => setFilter({ ...filter, resource: e.target.value })}
          />
          <select
            className="rounded border border-white/10 bg-transparent px-3 py-2 text-sm"
            value={filter.success}
            onChange={(e) => setFilter({ ...filter, success: e.target.value })}
          >
            <option value="">All Status</option>
            <option value="true">Success</option>
            <option value="false">Failed</option>
          </select>
          <button
            onClick={loadEvents}
            className="rounded border border-white/10 px-4 py-2 text-sm hover:bg-white/5"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-white/10">
        <table className="w-full">
          <thead className="border-b border-white/10">
            <tr className="text-left text-sm opacity-70">
              <th className="px-4 py-3">Timestamp</th>
              <th className="px-4 py-3">Level</th>
              <th className="px-4 py-3">Actor</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Resource</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {loading && events.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center">
                  Loading audit events...
                </td>
              </tr>
            ) : filteredEvents.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center opacity-70">
                  No audit events found
                </td>
              </tr>
            ) : (
              filteredEvents.map((event) => (
                <tr key={event.id} className="hover:bg-white/5">
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {new Date(event.timestamp).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={
                        event.level === "error"
                          ? "danger"
                          : event.level === "warn"
                          ? "warning"
                          : "default"
                      }
                    >
                      {event.level}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium">{event.actor}</td>
                  <td className="px-4 py-3 text-sm">{event.action}</td>
                  <td className="px-4 py-3 text-sm opacity-70">{event.resource}</td>
                  <td className="px-4 py-3 text-sm">{event.resourceName}</td>
                  <td className="px-4 py-3">
                    <Badge variant={event.success ? "success" : "danger"}>
                      {event.success ? "Success" : "Failed"}
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
