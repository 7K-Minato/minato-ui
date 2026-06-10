"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button, Badge } from "7k-design-system/react";
import { useGameServer, useGameServerActions } from "@/lib/queries/gameserver";
import { useToastStore } from "@/components/ui/Toast";
import OverviewTab from "./tabs/OverviewTab";
import ActionsTab from "./tabs/ActionsTab";
import SnapshotsTab from "./tabs/SnapshotsTab";
import PlayersTab from "./tabs/PlayersTab";
import ConsoleTab from "./tabs/ConsoleTab";
import Skeleton from "@/components/ui/Skeleton";

export default function GameServerDetailPage({
  params,
}: {
  params: Promise<{ namespace: string; name: string }>;
}) {
  const searchParams = useSearchParams();
  const controlPlaneId = searchParams.get("cp") || "";
  const [namespace, setNamespace] = useState("");
  const [name, setName] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [snapshots, setSnapshots] = useState<
    Array<{
      metadata: { name: string; creationTimestamp?: string };
      spec: { gameServerRef: string; schedule?: string };
      status?: { state: string; readyAt?: string; size?: string };
    }
  >>([]);
  const [creatingSnapshot, setCreatingSnapshot] = useState(false);
  const [players, setPlayers] = useState<
    Array<{
      id: string;
      name: string;
      status: string;
      connectedAt: string;
      ping?: number;
    }
  >>([]);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const [consoleLoading, setConsoleLoading] = useState(false);
  const { addToast } = useToastStore();

  const {
    data: server,
    isLoading: serverLoading,
    error: serverError,
  } = useGameServer(controlPlaneId, namespace, name);

  const { data: actions } = useGameServerActions(
    controlPlaneId,
    namespace,
    name
  );

  useEffect(() => {
    params.then(({ namespace, name }) => {
      setNamespace(namespace);
      setName(name);
    });
  }, [params]);

  // Load tab data when tab changes
  useEffect(() => {
    if (!namespace || !name || !controlPlaneId) return;

    if (activeTab === "snapshots") loadSnapshots();
    if (activeTab === "players") loadPlayers();
    if (activeTab === "console") loadConsoleLogs();
  }, [activeTab, namespace, name, controlPlaneId]);

  async function loadSnapshots() {
    try {
      const res = await fetch(
        `/api/proxy/api/v1/gameservers/${namespace}/${name}/snapshots`,
        { headers: { "X-Control-Plane-Id": controlPlaneId } }
      );
      if (res.ok) {
        const data = await res.json();
        setSnapshots(data);
      }
    } catch {
      addToast("Failed to load snapshots", "error");
    }
  }

  async function loadPlayers() {
    try {
      const res = await fetch(
        `/api/proxy/api/v1/gameservers/${namespace}/${name}/players`,
        { headers: { "X-Control-Plane-Id": controlPlaneId } }
      );
      if (res.ok) {
        const data = await res.json();
        setPlayers(data.players || []);
      }
    } catch {
      addToast("Failed to load players", "error");
    }
  }

  async function loadConsoleLogs() {
    try {
      setConsoleLoading(true);
      const res = await fetch(
        `/api/proxy/api/v1/gameservers/${namespace}/${name}/console`,
        { headers: { "X-Control-Plane-Id": controlPlaneId } }
      );
      if (res.ok) {
        const data = await res.json();
        setConsoleLogs(data.logs || []);
      }
    } catch {
      addToast("Failed to load console logs", "error");
    } finally {
      setConsoleLoading(false);
    }
  }

  async function handleCreateSnapshot() {
    try {
      setCreatingSnapshot(true);
      const res = await fetch(
        `/api/proxy/api/v1/gameservers/${namespace}/${name}/snapshots`,
        {
          method: "POST",
          headers: { "X-Control-Plane-Id": controlPlaneId },
        }
      );
      if (res.ok) {
        addToast("Snapshot created", "success");
        loadSnapshots();
      } else {
        addToast("Failed to create snapshot", "error");
      }
    } catch {
      addToast("Failed to create snapshot", "error");
    } finally {
      setCreatingSnapshot(false);
    }
  }

  if (serverLoading) {
    return (
      <div className="container mx-auto p-8 space-y-8">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-4 w-48" />
        <div className="grid gap-4 md:grid-cols-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      </div>
    );
  }

  if (serverError || !server) {
    return (
      <div className="container mx-auto p-8">
        <p className="text-red-400">Failed to load game server</p>
        <Link href="/gameservers">
          <Button variant="primary" className="mt-4">
            Back to Game Servers
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      {/* Breadcrumb */}
      <nav className="mb-4 text-sm opacity-70">
        <Link href="/gameservers" className="hover:underline">
          Game Servers
        </Link>
        <span className="mx-2">/</span>
        <span>{server.metadata.namespace}</span>
        <span className="mx-2">/</span>
        <span>{server.metadata.name}</span>
      </nav>

      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">{server.metadata.name}</h1>
          <Badge
            variant={
              server.status?.state === "Running"
                ? "success"
                : server.status?.state === "Error"
                ? "danger"
                : "warning"
            }
          >
            {server.status?.state || "Unknown"}
          </Badge>
        </div>
        <p className="mt-1 text-sm opacity-70">
          {server.spec.profile} • {server.metadata.namespace}
        </p>
      </header>

      {/* Tabs */}
      <div className="mb-6 border-b border-white/10">
        <div className="flex gap-6">
          {["overview", "actions", "snapshots", "players", "console"].map(
            (tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-sm font-medium capitalize transition-colors ${
                  activeTab === tab
                    ? "border-b-2 border-white text-white"
                    : "text-white/50 hover:text-white/70"
                }`}
              >
                {tab}
              </button>
            )
          )}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && <OverviewTab server={server} />}

      {activeTab === "actions" && (
        <ActionsTab
          controlPlaneId={controlPlaneId}
          namespace={namespace}
          name={name}
          actions={actions || []}
        />
      )}

      {activeTab === "snapshots" && (
        <SnapshotsTab
          snapshots={snapshots}
          creating={creatingSnapshot}
          onCreate={handleCreateSnapshot}
        />
      )}

      {activeTab === "players" && (
        <PlayersTab
          controlPlaneId={controlPlaneId}
          namespace={namespace}
          name={name}
          players={players}
          playerCapacity={server.status?.playerCapacity}
          onRefresh={loadPlayers}
        />
      )}

      {activeTab === "console" && (
        <ConsoleTab
          logs={consoleLogs}
          loading={consoleLoading}
          onRefresh={loadConsoleLogs}
        />
      )}
    </div>
  );
}
