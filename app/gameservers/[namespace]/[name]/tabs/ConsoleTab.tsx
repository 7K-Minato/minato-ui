import { useState } from "react";
import { Button } from "7k-design-system/react";

interface ConsoleTabProps {
  logs: string[];
  loading: boolean;
  onRefresh: () => void;
}

export default function ConsoleTab({ logs, loading, onRefresh }: ConsoleTabProps) {
  const [autoScroll, setAutoScroll] = useState(true);

  return (
    <div className="flex h-[600px] flex-col">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="mono-label">CONSOLE</h2>
        <div className="flex gap-2">
          <label className="flex items-center gap-2 mono-label">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="checkbox checkbox-accent"
            />
            AUTO-SCROLL
          </label>
          <Button variant="secondary" size="sm" onClick={onRefresh}>
            REFRESH
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto border-2 border-white bg-black p-4 font-mono text-sm scanline flicker">
        {loading && logs.length === 0 ? (
          <p className="text-white/70">Loading console logs...</p>
        ) : logs.length === 0 ? (
          <p className="text-white/70">No console logs available</p>
        ) : (
          <div className="space-y-1">
            {logs.map((log, index) => (
              <div key={index} className="break-all">
                <span className="text-white/50">
                  {new Date().toLocaleTimeString()}
                </span>{" "}
                {log}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
