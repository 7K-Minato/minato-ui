"use client";

import { useWebSocket } from "@/lib/websocket";

export default function ConnectionStatus({ controlPlaneId }: { controlPlaneId: string }) {
  const { isConnected } = useWebSocket({
    url: `wss://api.minato.io/v1/realtime?cp=${controlPlaneId}`,
  });

  return (
    <div className="flex items-center gap-2 text-sm">
      <div
        className={`h-2 w-2 rounded-full ${
          isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"
        }`}
      />
      <span className={isConnected ? "text-green-400" : "text-red-400"}>
        {isConnected ? "Live" : "Polling"}
      </span>
    </div>
  );
}
