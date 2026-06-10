import { useState } from "react";
import { Button, Badge } from "7k-design-system/react";
import { useToastStore } from "@/components/ui/Toast";

interface Player {
  id: string;
  name: string;
  status: string;
  connectedAt: string;
  ping?: number;
}

interface PlayersTabProps {
  controlPlaneId: string;
  namespace: string;
  name: string;
  players: Player[];
  playerCapacity?: number;
  onRefresh: () => void;
}

export default function PlayersTab({
  players,
  playerCapacity,
  onRefresh,
}: PlayersTabProps) {
  const [kickingPlayer, setKickingPlayer] = useState<string | null>(null);
  const { addToast } = useToastStore();

  async function handleKickPlayer(playerId: string) {
    if (!confirm("Kick this player?")) return;

    try {
      setKickingPlayer(playerId);
      addToast("Player kicked", "success");
      onRefresh();
    } catch {
      addToast("Failed to kick player", "error");
    } finally {
      setKickingPlayer(null);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          Players ({players.length} / {playerCapacity ?? "-"})
        </h2>
        <Button variant="secondary" onClick={onRefresh}>
          Refresh
        </Button>
      </div>

      {players.length === 0 ? (
        <div className="rounded-lg border border-white/10 p-8 text-center">
          <p className="opacity-70">No players connected</p>
        </div>
      ) : (
        <div className="rounded-lg border border-white/10">
          <table className="w-full">
            <thead className="border-b border-white/10">
              <tr className="text-left text-sm opacity-70">
                <th className="px-4 py-3">Player</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Connected</th>
                <th className="px-4 py-3">Ping</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {players.map((player) => (
                <tr key={player.id}>
                  <td className="px-4 py-3 font-medium">{player.name}</td>
                  <td className="px-4 py-3">
                    <Badge variant="success">{player.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-sm opacity-70">
                    {player.connectedAt
                      ? new Date(player.connectedAt).toLocaleString()
                      : "-"}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {player.ping ? `${player.ping}ms` : "-"}
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleKickPlayer(player.id)}
                      disabled={kickingPlayer === player.id}
                    >
                      {kickingPlayer === player.id ? "Kicking..." : "Kick"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
