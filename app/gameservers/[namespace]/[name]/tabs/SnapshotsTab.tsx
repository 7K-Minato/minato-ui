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
        <h2 className="text-xl font-semibold">Snapshots</h2>
        <Button
          variant="primary"
          onClick={onCreate}
          disabled={creating}
        >
          {creating ? "Creating..." : "+ Create Snapshot"}
        </Button>
      </div>

      {snapshots.length === 0 ? (
        <div className="rounded-lg border border-white/10 p-8 text-center">
          <p className="opacity-70">No snapshots found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {snapshots.map((snapshot) => (
            <div
              key={snapshot.metadata.name}
              className="flex items-center justify-between rounded-lg border border-white/10 p-4"
            >
              <div>
                <p className="font-medium">{snapshot.metadata.name}</p>
                <div className="mt-1 flex gap-4 text-sm opacity-70">
                  <span>
                    Created:{" "}
                    {snapshot.metadata.creationTimestamp
                      ? new Date(
                          snapshot.metadata.creationTimestamp
                        ).toLocaleString()
                      : "-"}
                  </span>
                  {snapshot.status?.size && (
                    <span>Size: {snapshot.status.size}</span>
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
                {snapshot.status?.state || "Pending"}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
