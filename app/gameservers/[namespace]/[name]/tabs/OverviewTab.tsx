import { Badge } from "7k-design-system/react";
import { GameServer } from "@/lib/gameserver-api";

interface OverviewTabProps {
  server: GameServer;
}

export default function OverviewTab({ server }: OverviewTabProps) {
  const stateColors: Record<string, string> = {
    Running: "text-green-400",
    Provisioning: "text-blue-400",
    Idle: "text-yellow-400",
    Stopped: "text-gray-400",
    Error: "text-red-400",
  };

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        {/* Status Card */}
        <div className="rounded-lg border border-white/10 p-6">
          <h2 className="mb-4 text-lg font-semibold">Status</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div>
              <p className="text-sm opacity-70">State</p>
              <p
                className={`text-lg font-medium ${stateColors[server.status?.state || ""]}`}
              >
                {server.status?.state || "Unknown"}
              </p>
            </div>
            <div>
              <p className="text-sm opacity-70">Players</p>
              <p className="text-lg font-medium">
                {server.status?.players ?? 0} /{" "}
                {server.status?.playerCapacity ?? "-"}
              </p>
            </div>
            <div>
              <p className="text-sm opacity-70">Agent Version</p>
              <p className="text-lg font-medium">
                {server.status?.agentVersion || "-"}
              </p>
            </div>
            <div>
              <p className="text-sm opacity-70">Created</p>
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
          <div className="rounded-lg border border-white/10 p-6">
            <h2 className="mb-4 text-lg font-semibold">Endpoints</h2>
            <div className="space-y-2">
              {server.status.endpoints.map((endpoint) => (
                <div
                  key={endpoint.name}
                  className="flex items-center justify-between rounded bg-white/5 px-4 py-2"
                >
                  <span className="font-medium">{endpoint.name}</span>
                  <span className="text-sm opacity-70">
                    {endpoint.address || "-"}:{endpoint.port}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Conditions */}
        {server.status?.conditions && server.status.conditions.length > 0 && (
          <div className="rounded-lg border border-white/10 p-6">
            <h2 className="mb-4 text-lg font-semibold">Conditions</h2>
            <div className="space-y-2">
              {server.status.conditions.map((condition) => (
                <div
                  key={condition.type}
                  className="flex items-center justify-between rounded bg-white/5 px-4 py-2"
                >
                  <div>
                    <span className="font-medium">{condition.type}</span>
                    {condition.message && (
                      <p className="text-sm opacity-70">{condition.message}</p>
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
        <div className="rounded-lg border border-white/10 p-6">
          <h2 className="mb-4 text-lg font-semibold">Configuration</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm opacity-70">Profile</p>
              <p className="font-medium">{server.spec.profile}</p>
            </div>
            {server.spec.storage && (
              <div>
                <p className="text-sm opacity-70">Storage</p>
                <p className="font-medium">
                  {server.spec.storage.size || "Default"}
                  {server.spec.storage.storageClass &&
                    ` (${server.spec.storage.storageClass})`}
                </p>
              </div>
            )}
            {server.spec.env && Object.keys(server.spec.env).length > 0 && (
              <div>
                <p className="text-sm opacity-70">Environment Variables</p>
                <div className="mt-2 space-y-1">
                  {Object.entries(server.spec.env).map(([key, value]) => (
                    <div
                      key={key}
                      className="rounded bg-white/5 px-3 py-1 text-sm"
                    >
                      <span className="opacity-70">{key}=</span>
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
