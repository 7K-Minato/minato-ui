import { Badge } from "7k-design-system/react";
import { GameServer } from "@/lib/gameserver-api";

interface OverviewTabProps {
  server: GameServer;
}

export default function OverviewTab({ server }: OverviewTabProps) {
  const stateColors: Record<string, string> = {
    Running: "text-status-success",
    Provisioning: "text-status-info",
    Idle: "text-status-warning",
    Stopped: "text-white/50",
    Error: "text-status-danger",
  };

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        {/* Status Card */}
        <div className="border-2 border-white p-6 accent-border-top">
          <h2 className="mb-4 mono-label">STATUS</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div>
              <p className="mono-label text-white/70">STATE</p>
              <p className={`text-lg font-medium ${stateColors[server.status?.state || ""]}`}>
                {server.status?.state || "Unknown"}
              </p>
            </div>
            <div>
              <p className="mono-label text-white/70">PLAYERS</p>
              <p className="text-lg font-medium">
                {server.status?.players ?? 0} /{" "}
                {server.status?.playerCapacity ?? "-"}
              </p>
            </div>
            <div>
              <p className="mono-label text-white/70">AGENT VERSION</p>
              <p className="text-lg font-medium">
                {server.status?.agentVersion || "-"}
              </p>
            </div>
            <div>
              <p className="mono-label text-white/70">CREATED</p>
              <p className="text-lg font-medium">
                {server.metadata.creationTimestamp
                  ? new Date(server.metadata.creationTimestamp).toLocaleDateString()
                  : "-"}
              </p>
            </div>
          </div>
        </div>

        {/* Endpoints */}
        {server.status?.endpoints && server.status.endpoints.length > 0 && (
          <div className="border-2 border-white p-6 cyan-border-top">
            <h2 className="mb-4 mono-label">ENDPOINTS</h2>
            <div className="space-y-2">
              {server.status.endpoints.map((endpoint) => (
                <div
                  key={endpoint.name}
                  className="flex items-center justify-between border border-white/20 px-4 py-2"
                >
                  <span className="font-medium">{endpoint.name}</span>
                  <span className="mono-label text-white/70">
                    {endpoint.address || "-"}:{endpoint.port}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Conditions */}
        {server.status?.conditions && server.status.conditions.length > 0 && (
          <div className="border-2 border-white p-6 grid-border-top">
            <h2 className="mb-4 mono-label">CONDITIONS</h2>
            <div className="space-y-2">
              {server.status.conditions.map((condition) => (
                <div
                  key={condition.type}
                  className="flex items-center justify-between border border-white/20 px-4 py-2"
                >
                  <div>
                    <span className="font-medium">{condition.type}</span>
                    {condition.message && (
                      <p className="text-sm text-white/70">{condition.message}</p>
                    )}
                  </div>
                  <Badge
                    variant={condition.status === "True" ? "success" : "warning"}
                  >
                    {condition.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Configuration */}
        <div className="border-2 border-white p-6 line-border-top">
          <h2 className="mb-4 mono-label">CONFIGURATION</h2>
          <div className="space-y-4">
            <div>
              <p className="mono-label text-white/70">PROFILE</p>
              <p className="font-medium">{server.spec.profile}</p>
            </div>
            {server.spec.storage && (
              <div>
                <p className="mono-label text-white/70">STORAGE</p>
                <p className="font-medium">
                  {server.spec.storage.size || "Default"}
                  {server.spec.storage.storageClass &&
                    ` (${server.spec.storage.storageClass})`}
                </p>
              </div>
            )}
            {server.spec.env && Object.keys(server.spec.env).length > 0 && (
              <div>
                <p className="mono-label text-white/70">ENVIRONMENT VARIABLES</p>
                <div className="mt-2 space-y-1">
                  {Object.entries(server.spec.env).map(([key, value]) => (
                    <div
                      key={key}
                      className="border border-white/20 px-3 py-1 text-sm"
                    >
                      <span className="text-white/70">{key}=</span>
                      <span>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
