import { useState } from "react";
import { Button, Input } from "7k-design-system/react";
import { useToastStore } from "@/components/ui/Toast";
import { useExecuteAction } from "@/lib/queries/gameserver";

interface Action {
  name: string;
  description: string;
  concurrency: string;
  timeout?: string;
  params?: Record<
    string,
    {
      type: string;
      required?: boolean;
      default?: string;
    }
  >;
}

interface ActionsTabProps {
  controlPlaneId: string;
  namespace: string;
  name: string;
  actions: Action[];
}

export default function ActionsTab({
  controlPlaneId,
  namespace,
  name,
  actions,
}: ActionsTabProps) {
  const [executingAction, setExecutingAction] = useState<string | null>(null);
  const [actionParams, setActionParams] = useState<Record<string, string>>({});
  const executeMutation = useExecuteAction();
  const { addToast } = useToastStore();

  async function handleExecuteAction(actionName: string) {
    try {
      setExecutingAction(actionName);
      const action = actions.find((a) => a.name === actionName);
      const params: Record<string, string> = {};

      if (action?.params) {
        for (const [key, config] of Object.entries(action.params)) {
          if (config.required && !actionParams[`${actionName}.${key}`]) {
            addToast(`Parameter ${key} is required`, "warning");
            return;
          }
          if (actionParams[`${actionName}.${key}`]) {
            params[key] = actionParams[`${actionName}.${key}`];
          }
        }
      }

      await executeMutation.mutateAsync({
        controlPlaneId,
        namespace,
        name,
        action: actionName,
        params,
      });
      addToast(`Action "${actionName}" executed`, "success");
      setActionParams((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((k) => {
          if (k.startsWith(`${actionName}.`)) delete next[k];
        });
        return next;
      });
    } catch {
      addToast(`Failed to execute "${actionName}"`, "error");
    } finally {
      setExecutingAction(null);
    }
  }

  return (
    <div className="max-w-2xl space-y-4">
      {actions.map((action) => (
        <div
          key={action.name}
          className="rounded-lg border border-white/10 p-6"
        >
          <div>
            <p className="font-medium">{action.name}</p>
            <p className="text-sm opacity-70">{action.description}</p>
          </div>

          {action.params && Object.keys(action.params).length > 0 && (
            <div className="mt-4 space-y-3">
              {Object.entries(action.params).map(([key, config]) => (
                <div key={key}>
                  <label className="block text-sm opacity-70">
                    {key}
                    {config.required && (
                      <span className="text-red-400">*</span>
                    )}
                  </label>
                  <Input
                    value={actionParams[`${action.name}.${key}`] || ""}
                    onChange={(e) =>
                      setActionParams({
                        ...actionParams,
                        [`${action.name}.${key}`]: e.target.value,
                      })
                    }
                    placeholder={config.default || `Enter ${key}`}
                    className="mt-1"
                  />
                </div>
              ))}
            </div>
          )}

          <Button
            variant="primary"
            className="mt-4"
            onClick={() => handleExecuteAction(action.name)}
            disabled={executingAction === action.name}
          >
            {executingAction === action.name
              ? "Executing..."
              : "Execute Action"}
          </Button>
        </div>
      ))}
    </div>
  );
}
