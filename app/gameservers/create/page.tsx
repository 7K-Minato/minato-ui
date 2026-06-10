"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "7k-design-system/react";
import { gameServerAPI } from "@/lib/gameserver-api";
import { controlPlaneAPI } from "@/lib/control-plane-api";

interface Profile {
  metadata: {
    name: string;
  };
  spec: {
    displayName: string;
    environment?: Array<{
      key: string;
      default?: string;
      required?: boolean;
    }>;
  };
}

export default function CreateGameServerPage() {
  const router = useRouter();
  const [controlPlanes, setControlPlanes] = useState<Array<{ id: string; name: string }>>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedCP, setSelectedCP] = useState("");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    namespace: "default",
    profile: "",
    env: {} as Record<string, string>,
    storageSize: "",
  });

  useEffect(() => {
    loadControlPlanes();
  }, []);

  useEffect(() => {
    if (selectedCP) {
      loadProfiles();
    }
  }, [selectedCP]);

  async function loadControlPlanes() {
    try {
      const cps = await controlPlaneAPI.list();
      setControlPlanes(cps.map((cp) => ({ id: cp.id, name: cp.name })));
      if (cps.length > 0) {
        setSelectedCP(cps[0].id);
      }
    } catch (error) {
      console.error("Failed to load control planes:", error);
    }
  }

  async function loadProfiles() {
    try {
      const res = await fetch(`/api/proxy/api/v1/profiles`, {
        headers: {
          "X-Control-Plane-Id": selectedCP,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setProfiles(data);
      }
    } catch (error) {
      console.error("Failed to load profiles:", error);
    }
  }

  function handleEnvChange(key: string, value: string) {
    setFormData({
      ...formData,
      env: { ...formData.env, [key]: value },
    });
  }

  const selectedProfile = profiles.find((p) => p.metadata.name === formData.profile);

  async function handleSubmit() {
    try {
      setLoading(true);
      const server = {
        apiVersion: "operator.minato.io/v1",
        kind: "GameServer",
        metadata: {
          name: formData.name,
          namespace: formData.namespace,
        },
        spec: {
          profile: formData.profile,
          env: formData.env,
          ...(formData.storageSize && {
            storage: {
              size: formData.storageSize,
            },
          }),
        },
      };

      await gameServerAPI.create(selectedCP, formData.namespace, server);
      router.push(`/gameservers?cp=${selectedCP}`);
    } catch (error) {
      console.error("Failed to create server:", error);
      alert("Failed to create game server");
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto max-w-2xl p-8">
      <h1 className="mb-8 text-3xl font-bold">Create Game Server</h1>

      {/* Progress Steps */}
      <div className="mb-8 flex items-center gap-4">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full ${
                s === step
                  ? "bg-white text-black"
                  : s < step
                  ? "bg-green-500"
                  : "bg-white/10"
              }`}
            >
              {s < step ? "✓" : s}
            </div>
            {s < 3 && <div className="h-px w-8 bg-white/20" />}
          </div>
        ))}
      </div>

      {/* Control Plane Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Control Plane</label>
        <select
          className="w-full rounded border border-white/10 bg-transparent px-3 py-2"
          value={selectedCP}
          onChange={(e) => setSelectedCP(e.target.value)}
        >
          {controlPlanes.map((cp) => (
            <option key={cp.id} value={cp.id}>{cp.name}</option>
          ))}
        </select>
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Basic Information</h2>
          <div>
            <label className="block text-sm font-medium mb-1">Server Name</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="my-minecraft-server"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Namespace</label>
            <Input
              value={formData.namespace}
              onChange={(e) => setFormData({ ...formData, namespace: e.target.value })}
              placeholder="default"
              required
            />
          </div>
          <Button variant="primary" onClick={() => setStep(2)} disabled={!formData.name}>
            Next
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Select Profile</h2>
          <div className="grid gap-4">
            {profiles.map((profile) => (
              <button
                key={profile.metadata.name}
                onClick={() => setFormData({ ...formData, profile: profile.metadata.name })}
                className={`rounded-lg border p-4 text-left transition-colors ${
                  formData.profile === profile.metadata.name
                    ? "border-white bg-white/10"
                    : "border-white/10 hover:bg-white/5"
                }`}
              >
                <p className="font-medium">{profile.spec.displayName || profile.metadata.name}</p>
                <p className="text-sm opacity-70">{profile.metadata.name}</p>
              </button>
            ))}
          </div>
          <div className="flex gap-4">
            <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
            <Button variant="primary" onClick={() => setStep(3)} disabled={!formData.profile}>
              Next
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Configuration</h2>

          {selectedProfile?.spec.environment &&
            selectedProfile.spec.environment.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium opacity-70">Environment Variables</h3>
                {selectedProfile.spec.environment.map((env) => (
                  <div key={env.key}>
                    <label className="block text-sm">
                      {env.key}
                      {env.required && <span className="text-red-400">*</span>}
                    </label>
                    <Input
                      value={formData.env[env.key] || ""}
                      onChange={(e) => handleEnvChange(env.key, e.target.value)}
                      placeholder={env.default || `Enter ${env.key}`}
                      required={env.required}
                    />
                  </div>
                ))}
              </div>
            )}

          <div>
            <label className="block text-sm font-medium mb-1">Storage Size (optional)</label>
            <Input
              value={formData.storageSize}
              onChange={(e) => setFormData({ ...formData, storageSize: e.target.value })}
              placeholder="20Gi"
            />
          </div>

          <div className="rounded-lg bg-white/5 p-4">
            <h3 className="mb-2 text-sm font-medium">Review</h3>
            <div className="space-y-1 text-sm">
              <p>
                <span className="opacity-70">Name: </span>{formData.name}
              </p>
              <p>
                <span className="opacity-70">Namespace: </span>{formData.namespace}
              </p>
              <p>
                <span className="opacity-70">Profile: </span>{formData.profile}
              </p>
              {formData.storageSize && (
                <p>
                  <span className="opacity-70">Storage: </span>{formData.storageSize}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-4">
            <Button variant="ghost" onClick={() => setStep(2)}>Back</Button>
            <Button variant="primary" onClick={handleSubmit} disabled={loading}>
              {loading ? "Creating..." : "Create Server"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
