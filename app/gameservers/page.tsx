"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Badge, Input } from "7k-design-system/react";
import { useGameServers, useDeleteGameServer } from "@/lib/queries/gameserver";
import { useControlPlanes } from "@/lib/queries/control-plane";
import { useAppStore } from "@/lib/store";
import { useToastStore } from "@/components/ui/Toast";
import { GameServer } from "@/lib/gameserver-api";
import { SkeletonTable } from "@/components/ui/Skeleton";

function StatusBadge({ state }: { state: string }) {
  const variants: Record<string, "success" | "warning" | "danger" | "info" | "default"> = {
    Running: "success",
    Provisioning: "info",
    Idle: "warning",
    Stopped: "default",
    Error: "danger",
  };

  return <Badge variant={variants[state] || "default"}>{state}</Badge>;
}

export default function GameServersPage() {
  const { selectedControlPlaneId, setSelectedControlPlaneId } = useAppStore();
  const { data: controlPlanes, isLoading: cpLoading } = useControlPlanes();
  const { data: servers, isLoading: serversLoading } = useGameServers(
    selectedControlPlaneId || ""
  );
  const deleteMutation = useDeleteGameServer();
  const { addToast } = useToastStore();

  const [filters, setFilters] = useState<{
    search?: string;
    namespace?: string;
    profile?: string;
    status?: string;
    minPlayers?: number;
    maxPlayers?: number;
  }>({});
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedServers, setSelectedServers] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Auto-select first CP if none selected
  if (!selectedControlPlaneId && controlPlanes && controlPlanes.length > 0) {
    setSelectedControlPlaneId(controlPlanes[0].id);
  }

  const filteredServers = (servers || [])
    .filter((server: GameServer) => {
      if (filters.search) {
        const search = filters.search.toLowerCase();
        return (
          server.metadata.name.toLowerCase().includes(search) ||
          server.metadata.namespace.toLowerCase().includes(search) ||
          server.spec.profile.toLowerCase().includes(search)
        );
      }
      return true;
    })
    .filter((server: GameServer) => {
      if (filters.namespace) return server.metadata.namespace === filters.namespace;
      return true;
    })
    .filter((server: GameServer) => {
      if (filters.profile) return server.spec.profile === filters.profile;
      return true;
    })
    .filter((server: GameServer) => {
      if (filters.status) return server.status?.state === filters.status;
      return true;
    })
    .filter((server: GameServer) => {
      if (filters.minPlayers !== undefined)
        return (server.status?.players ?? 0) >= filters.minPlayers;
      return true;
    })
    .filter((server: GameServer) => {
      if (filters.maxPlayers !== undefined)
        return (server.status?.players ?? 0) <= filters.maxPlayers;
      return true;
    });

  // Sort
  const sortedServers = [...filteredServers].sort((a, b) => {
    if (!sortConfig) return 0;
    let aVal: string | number = "";
    let bVal: string | number = "";

    switch (sortConfig.key) {
      case "name":
        aVal = a.metadata.name;
        bVal = b.metadata.name;
        break;
      case "namespace":
        aVal = a.metadata.namespace;
        bVal = b.metadata.namespace;
        break;
      case "profile":
        aVal = a.spec.profile;
        bVal = b.spec.profile;
        break;
      case "status":
        aVal = a.status?.state || "";
        bVal = b.status?.state || "";
        break;
      case "players":
        aVal = a.status?.players ?? 0;
        bVal = b.status?.players ?? 0;
        break;
      case "created":
        aVal = a.metadata.creationTimestamp
          ? new Date(a.metadata.creationTimestamp).getTime()
          : 0;
        bVal = b.metadata.creationTimestamp
          ? new Date(b.metadata.creationTimestamp).getTime()
          : 0;
        break;
    }

    if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(sortedServers.length / pageSize);
  const paginatedServers = sortedServers.slice((page - 1) * pageSize, page * pageSize);

  const namespaces = [...new Set((servers || []).map((s: GameServer) => s.metadata.namespace))];
  const profiles = [...new Set((servers || []).map((s: GameServer) => s.spec.profile))];
  const statuses = [
    ...new Set(
      (servers || []).map((s: GameServer) => s.status?.state).filter(Boolean)
    ),
  ];

  async function handleDelete(namespace: string, name: string) {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;
    if (!selectedControlPlaneId) return;

    try {
      await deleteMutation.mutateAsync({
        controlPlaneId: selectedControlPlaneId,
        namespace,
        name,
      });
      addToast(`Game server "${name}" deleted`, "success");
    } catch {
      addToast(`Failed to delete "${name}"`, "error");
    }
  }

  function toggleServerSelection(serverId: string) {
    const newSelected = new Set(selectedServers);
    if (newSelected.has(serverId)) {
      newSelected.delete(serverId);
    } else {
      newSelected.add(serverId);
    }
    setSelectedServers(newSelected);
  }

  function toggleAllSelection() {
    if (selectedServers.size === paginatedServers.length) {
      setSelectedServers(new Set());
    } else {
      setSelectedServers(
        new Set(
          paginatedServers.map(
            (s) => s.metadata.uid || `${s.metadata.namespace}/${s.metadata.name}`
          )
        )
      );
    }
  }

  async function handleBulkDelete() {
    if (!confirm(`Delete ${selectedServers.size} servers?`)) return;
    if (!selectedControlPlaneId) return;

    const toDelete = paginatedServers.filter((s) =>
      selectedServers.has(s.metadata.uid || `${s.metadata.namespace}/${s.metadata.name}`)
    );

    let success = 0;
    let failed = 0;

    for (const server of toDelete) {
      try {
        await deleteMutation.mutateAsync({
          controlPlaneId: selectedControlPlaneId,
          namespace: server.metadata.namespace,
          name: server.metadata.name,
        });
        success++;
      } catch {
        failed++;
      }
    }

    setSelectedServers(new Set());
    if (failed > 0) {
      addToast(`Deleted ${success} servers, ${failed} failed`, "warning");
    } else {
      addToast(`Deleted ${success} servers`, "success");
    }
  }

  const isLoading = cpLoading || serversLoading;

  return (
    <div className="container mx-auto p-8">
      <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Game Servers</h1>
          <p className="mt-1 text-sm opacity-70">Manage your game servers across clusters</p>
        </div>
        <div className="flex gap-4">
          <select
            className="rounded border border-white/10 bg-transparent px-3 py-2"
            value={selectedControlPlaneId || ""}
            onChange={(e) => setSelectedControlPlaneId(e.target.value || null)}
          >
            <option value="">Select Control Plane</option>
            {controlPlanes?.map((cp) => (
              <option key={cp.id} value={cp.id}>
                {cp.name}
              </option>
            ))}
          </select>
          <Link href="/gameservers/create">
            <Button variant="primary">+ Create Server</Button>
          </Link>
        </div>
      </header>

      {/* Filters */}
      <div className="mb-6 space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Input
            placeholder="Search..."
            value={filters.search || ""}
            onChange={(e) => {
              setFilters({ ...filters, search: e.target.value });
              setPage(1);
            }}
          />
          <select
            className="rounded border border-white/10 bg-transparent px-3 py-2"
            value={filters.namespace || ""}
            onChange={(e) => {
              setFilters({ ...filters, namespace: e.target.value || undefined });
              setPage(1);
            }}
          >
            <option value="">All Namespaces</option>
            {namespaces.map((ns) => (
              <option key={ns} value={ns}>{ns}</option>
            ))}
          </select>
          <select
            className="rounded border border-white/10 bg-transparent px-3 py-2"
            value={filters.profile || ""}
            onChange={(e) => {
              setFilters({ ...filters, profile: e.target.value || undefined });
              setPage(1);
            }}
          >
            <option value="">All Profiles</option>
            {profiles.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <select
            className="rounded border border-white/10 bg-transparent px-3 py-2"
            value={filters.status || ""}
            onChange={(e) => {
              setFilters({ ...filters, status: e.target.value || undefined });
              setPage(1);
            }}
          >
            <option value="">All Statuses</option>
            {statuses.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="text-sm text-white/50 hover:text-white"
          >
            {showAdvancedFilters ? "Hide" : "Show"} Advanced Filters
          </button>
          <div className="flex items-center gap-4">
            <span className="text-sm opacity-70">
              {filteredServers.length} of {servers?.length || 0} servers
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilters({});
                setSortConfig(null);
                setPage(1);
              }}
            >
              Clear All
            </Button>
          </div>
        </div>

        {showAdvancedFilters && (
          <div className="grid grid-cols-1 gap-4 rounded-lg border border-white/10 p-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm opacity-70">Min Players</label>
              <Input
                type="number"
                placeholder="0"
                value={filters.minPlayers?.toString() ?? ""}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    minPlayers: e.target.value
                      ? parseInt(e.target.value)
                      : undefined,
                  })
                }
              />
            </div>
            <div>
              <label className="mb-1 block text-sm opacity-70">Max Players</label>
              <Input
                type="number"
                placeholder="∞"
                value={filters.maxPlayers?.toString() ?? ""}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    maxPlayers: e.target.value
                      ? parseInt(e.target.value)
                      : undefined,
                  })
                }
              />
            </div>
            <div>
              <label className="mb-1 block text-sm opacity-70">Sort By</label>
              <div className="flex gap-2">
                <select
                  className="flex-1 rounded border border-white/10 bg-transparent px-3 py-2"
                  value={sortConfig?.key || ""}
                  onChange={(e) =>
                    setSortConfig(
                      e.target.value
                        ? {
                            key: e.target.value,
                            direction: sortConfig?.direction || "asc",
                          }
                        : null
                    )
                  }
                >
                  <option value="">None</option>
                  <option value="name">Name</option>
                  <option value="namespace">Namespace</option>
                  <option value="profile">Profile</option>
                  <option value="status">Status</option>
                  <option value="players">Players</option>
                  <option value="created">Created</option>
                </select>
                {sortConfig && (
                  <button
                    onClick={() =>
                      setSortConfig({
                        ...sortConfig,
                        direction:
                          sortConfig.direction === "asc" ? "desc" : "asc",
                      })
                    }
                    className="rounded border border-white/10 px-3 py-2 text-sm hover:bg-white/5"
                  >
                    {sortConfig.direction === "asc" ? "↑" : "↓"}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Actions */}
      {selectedServers.size > 0 && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-4">
          <span className="text-sm font-medium">
            {selectedServers.size} server{selectedServers.size > 1 ? "s" : ""} selected
          </span>
          <Button
            variant="danger"
            size="sm"
            onClick={handleBulkDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete Selected"}
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border border-white/10">
        <table className="w-full">
          <thead className="border-b border-white/10">
            <tr className="text-left text-sm opacity-70">
              <th className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={
                    paginatedServers.length > 0 &&
                    selectedServers.size === paginatedServers.length
                  }
                  onChange={toggleAllSelection}
                  className="rounded"
                />
              </th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Namespace</th>
              <th className="px-4 py-3">Profile</th>
              <th className="px-4 py-3">Players</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="px-4 py-8">
                  <SkeletonTable rows={5} />
                </td>
              </tr>
            ) : paginatedServers.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-8 text-center opacity-70"
                >
                  {servers?.length === 0
                    ? "No game servers found"
                    : "No servers match your filters"}
                </td>
              </tr>
            ) : (
              paginatedServers.map((server) => {
                const serverId =
                  server.metadata.uid ||
                  `${server.metadata.namespace}/${server.metadata.name}`;
                return (
                  <tr key={serverId}>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedServers.has(serverId)}
                        onChange={() => toggleServerSelection(serverId)}
                        className="rounded"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge state={server.status?.state || "Unknown"} />
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/gameservers/${server.metadata.namespace}/${server.metadata.name}?cp=${selectedControlPlaneId}`}
                        className="font-medium hover:underline"
                      >
                        {server.metadata.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm opacity-70">
                      {server.metadata.namespace}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <Badge variant="default">{server.spec.profile}</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {server.status?.players ?? 0} /{" "}
                      {server.status?.playerCapacity ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-sm opacity-70">
                      {server.metadata.creationTimestamp
                        ? new Date(
                            server.metadata.creationTimestamp
                          ).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Link
                          href={`/gameservers/${server.metadata.namespace}/${server.metadata.name}?cp=${selectedControlPlaneId}`}
                        >
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleDelete(
                              server.metadata.namespace,
                              server.metadata.name
                            )
                          }
                          disabled={deleteMutation.isPending}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            Previous
          </Button>
          <span className="text-sm opacity-70">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
