"use client";

import { useState, useEffect, useCallback } from "react";
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
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    namespace: "default",
    profile: "",
    env: {} as Record<string, string>,
    storageSize: "",
    idleTimeoutSeconds: "",
    autoStart: false,
    storageClass: "",
    priorityClassName: "",
  });

  useEffect(() => {
    loadControlPlanes();
  }, []);

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

  const loadProfiles = useCallback(async () => {
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
  }, [selectedCP]);

  useEffect(() => {
    if (selectedCP) {
      loadProfiles();
    }
  }, [selectedCP, loadProfiles]);

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
      setError("");
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
              ...(formData.storageClass && { storageClass: formData.storageClass }),
            },
          }),
          ...(formData.idleTimeoutSeconds && {
            lifecycle: {
              idleTimeoutSeconds: parseInt(formData.idleTimeoutSeconds),
              autoStart: formData.autoStart,
            },
          }),
          ...(formData.priorityClassName && {
            priorityClassName: formData.priorityClassName,
          }),
        },
      };

      await gameServerAPI.create(selectedCP, formData.namespace, server);
      router.push(`/gameservers?cp=${selectedCP}`);
    } catch (error) {
      console.error("Failed to create server:", error);
      setError("Failed to create game server");
      setLoading(false);
    }
  }

  const steps = [
    { num: 1, label: "BASIC INFO" },
    { num: 2, label: "SELECT PROFILE" },
    { num: 3, label: "CONFIGURATION" },
  ];

  return (
    <div className="container mx-auto max-w-2xl p-8">
      <h1 className="mb-8 text-4xl font-black tracking-tightest">CREATE GAME SERVER</h1>

      {/* Stepper */}
      <div className="stepper mb-8">
        {steps.map((s, i) => (
          <>
            <div key={s.num} className={`step ${s.num === step ? "step-active" : ""} ${s.num < step ? "step-completed" : ""}`}>
              <span className="step-number">{s.num < step ? "✓" : s.num}</span>
              <span className="step-label mono-label">{s.label}</span>
            </div>
            {i < steps.length - 1 && <div className="step-line" />}
          </>
        ))}
      </div>

      {/* Control Plane Selection */}
      <div className="mb-6">
        <label className="mono-label block mb-2">CONTROL PLANE</label>
        <select
          className="w-full border-2 border-white bg-black px-3 py-2 mono-label"
          value={selectedCP}
          onChange={(e) => setSelectedCP(e.target.value)}
        >
          {controlPlanes.map((cp) => (
            <option key={cp.id} value={cp.id}>{cp.name}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="glitch mb-6 border-2 border-white bg-black p-4">
          <span className="text-white">{error}</span>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <h2 className="mono-label">BASIC INFORMATION</h2>
          <div>
            <label className="mono-label block mb-1">SERVER NAME</label>
            <Input
              value={formData.name}
              onChange={(value) => setFormData({ ...formData, name: value })}
              placeholder="my-minecraft-server"
              required
            />
          </div>
          <div>
            <label className="mono-label block mb-1">NAMESPACE</label>
            <Input
              value={formData.namespace}
              onChange={(value) => setFormData({ ...formData, namespace: value })}
              placeholder="default"
              required
            />
          </div>
          <Button variant="glow" onClick={() => setStep(2)} disabled={!formData.name}>
            NEXT
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h2 className="mono-label">SELECT PROFILE</h2>
          <div className="grid gap-4">
            {profiles.map((profile) => (
              <button
                key={profile.metadata.name}
                onClick={() => setFormData({ ...formData, profile: profile.metadata.name })}
                className={`border-2 p-4 text-left transition-colors ${
                  formData.profile === profile.metadata.name
                    ? "border-white bg-white text-black"
                    : "border-white/30 hover:border-white hover:bg-white/5"
                }`}
              >
                <p className="font-medium">{profile.spec.displayName || profile.metadata.name}</p>
                <p className="mono-label text-white/70">{profile.metadata.name}</p>
              </button>
            ))}
          </div>
          <div className="flex gap-4">
            <Button variant="ghost" onClick={() => setStep(1)}>BACK</Button>
            <Button variant="glow" onClick={() => setStep(3)} disabled={!formData.profile}>
              NEXT
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <h2 className="mono-label">CONFIGURATION</h2>

          {selectedProfile?.spec.environment &&
            selectedProfile.spec.environment.length > 0 && (
              <div className="space-y-3">
                <h3 className="mono-label">ENVIRONMENT VARIABLES</h3>
                {selectedProfile.spec.environment.map((env) => (
                  <div key={env.key}>
                    <label className="mono-label block">
                      {env.key}
                      {env.required && <span className="text-danger">*</span>}
                    </label>
                    <Input
                      value={formData.env[env.key] || ""}
                      onChange={(value) => handleEnvChange(env.key, value)}
                      placeholder={env.default || `Enter ${env.key}`}
                      required={env.required}
                    />
                  </div>
                ))}
              </div>
            )}

          <div>
            <label className="mono-label block mb-1">STORAGE SIZE (OPTIONAL)</label>
            <Input
              value={formData.storageSize}
              onChange={(value) => setFormData({ ...formData, storageSize: value })}
              placeholder="20Gi"
            />
          </div>

          <div>
            <label className="mono-label block mb-1">STORAGE CLASS (OPTIONAL)</label>
            <Input
              value={formData.storageClass}
              onChange={(value) => setFormData({ ...formData, storageClass: value })}
              placeholder="standard"
            />
          </div>

          <div>
            <label className="mono-label block mb-1">IDLE TIMEOUT SECONDS (OPTIONAL)</label>
            <Input
              type="number"
              value={formData.idleTimeoutSeconds}
              onChange={(value) => setFormData({ ...formData, idleTimeoutSeconds: value })}
              placeholder="3600"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="autoStart"
              checked={formData.autoStart}
              onChange={(e) => setFormData({ ...formData, autoStart: e.target.checked })}
              className="checkbox checkbox-accent"
            />
            <label htmlFor="autoStart" className="mono-label">AUTO START ON PLAYER JOIN</label>
          </div>

          <div>
            <label className="mono-label block mb-1">PRIORITY CLASS (OPTIONAL)</label>
            <Input
              value={formData.priorityClassName}
              onChange={(value) => setFormData({ ...formData, priorityClassName: value })}
              placeholder="high-priority"
            />
          </div>

          <div className="border-2 border-white bg-black p-4">
            <h3 className="mb-2 mono-label">REVIEW</h3>
            <div className="space-y-1 text-sm">
              <p>
                <span className="mono-label text-white/70">NAME: </span>{formData.name}
              </p>
              <p>
                <span className="mono-label text-white/70">NAMESPACE: </span>{formData.namespace}
              </p>
              <p>
                <span className="mono-label text-white/70">PROFILE: </span>{formData.profile}
              </p>
              {formData.storageSize && (
                <p>
                  <span className="mono-label text-white/70">STORAGE: </span>{formData.storageSize}
                </p>
              )}
              {formData.storageClass && (
                <p>
                  <span className="mono-label text-white/70">STORAGE CLASS: </span>{formData.storageClass}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-4">
            <Button variant="ghost" onClick={() => setStep(2)}>BACK</Button>
            <Button variant="glow" onClick={handleSubmit} disabled={loading}>
              {loading ? "CREATING..." : "CREATE SERVER"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
