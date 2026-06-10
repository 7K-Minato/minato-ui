import { Button, Badge } from "7k-design-system/react";

interface Snapshot {
  metadata: { name: string; creationTimestamp?: string };
  spec: { gameServerRef: string; schedule?: string };
  status?: { state: string; readyAt?: string; size?: string };
}

interface SnapshotsTabProps {
  snapshots: Snapshot[];
  creating: boolean;
  onCreate: () => void;
}

export default function SnapshotsTab({
  snapshots,
  creating,
  onCreate,
}: SnapshotsTabProps) {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="mono-label">SNAPSHOTS</h2>
        <Button
          variant="glow"
          onClick={onCreate}
          disabled={creating}
        >
          {creating ? "CREATING..." : "+ CREATE SNAPSHOT"}
        </Button>
      </div>

      {snapshots.length === 0 ? (
        <div className="empty border-2 border-dashed border-white/50 p-8 text-center">
          <p className="mono-label text-white/50">NO SNAPSHOTS FOUND</p>
        </div>
      ) : (
        <div className="space-y-4">
          {snapshots.map((snapshot) => (
            <div
              key={snapshot.metadata.name}
              className="flex items-center justify-between border-2 border-white p-4 accent-border-top"
            >
              <div>
                <p className="font-medium">{snapshot.metadata.name}</p>
                <div className="mt-1 flex gap-4 mono-label text-white/70">
                  <span>
                    CREATED:{" "}
                    {snapshot.metadata.creationTimestamp
                      ? new Date(
                          snapshot.metadata.creationTimestamp
                        ).toLocaleString()
                      : "-"}
                  </span>
                  {snapshot.status?.size && (
                    <span>SIZE: {snapshot.status.size}</span>
                  )}
                </div>
              </div>
              <Badge
                variant={
                  snapshot.status?.state === "Ready"
                    ? "success"
                    : snapshot.status?.state === "Failed"
                    ? "danger"
                    : "warning"
                }
              >
                {snapshot.status?.state || "PENDING"}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
