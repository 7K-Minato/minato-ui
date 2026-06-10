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
        <h2 className="mono-label">
          PLAYERS ({players.length} / {playerCapacity ?? "-"})
        </h2>
        <Button variant="secondary" onClick={onRefresh}>
          REFRESH
        </Button>
      </div>

      {players.length === 0 ? (
        <div className="empty border-2 border-dashed border-white/50 p-8 text-center">
          <p className="mono-label text-white/50">NO PLAYERS CONNECTED</p>
        </div>
      ) : (
        <div className="border-2 border-white">
          <table className="table w-full">
            <thead>
              <tr>
                <th className="px-4 py-3">PLAYER</th>
                <th className="px-4 py-3">STATUS</th>
                <th className="px-4 py-3">CONNECTED</th>
                <th className="px-4 py-3">PING</th>
                <th className="px-4 py-3">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-white">
              {players.map((player) => (
                <tr key={player.id}>
                  <td className="px-4 py-3 font-medium">{player.name}</td>
                  <td className="px-4 py-3">
                    <Badge variant="success">{player.status}</Badge>
                  </td>
                  <td className="px-4 py-3 mono-label text-white/70">
                    {player.connectedAt
                      ? new Date(player.connectedAt).toLocaleString()
                      : "-"}
                  </td>
                  <td className="px-4 py-3 mono-label">
                    {player.ping ? `${player.ping}ms` : "-"}
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleKickPlayer(player.id)}
                      disabled={kickingPlayer === player.id}
                    >
                      {kickingPlayer === player.id ? "KICKING..." : "KICK"}
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
