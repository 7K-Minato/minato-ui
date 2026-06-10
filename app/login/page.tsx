"use client";

import { useState } from "react";
import { Button, Input } from "7k-design-system/react";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [controlPlaneUrl, setControlPlaneUrl] = useState(
    process.env.NEXT_PUBLIC_CONTROL_PLANE_URL || "http://localhost:8080"
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleBasicAuth(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn("basic", {
        username,
        password,
        controlPlaneUrl,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid credentials");
      } else {
        window.location.href = "/";
      }
    } catch {
      setError("Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleOIDC() {
    setLoading(true);
    await signIn("oidc", { callbackUrl: "/" });
  }

  return (
    <div className="flex min-h-screen items-center justify-center scanline">
      <div className="w-full max-w-md space-y-8 p-8 border-2 border-white bg-black">
        <div className="text-center">
          <h1 className="text-4xl font-black tracking-tightest" style={{ fontFamily: "var(--font-geist-mono)" }}>
            MINATO
          </h1>
          <p className="mt-2 mono-label text-white/70">SIGN IN TO MANAGE YOUR GAME SERVERS</p>
        </div>

        {error && (
          <div className="glitch border-2 border-white bg-black p-4 text-sm">
            <span className="text-white">{error}</span>
          </div>
        )}

        <form onSubmit={handleBasicAuth} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="controlPlaneUrl" className="mono-label block mb-1">
                CONTROL PLANE URL
              </label>
              <Input
                id="controlPlaneUrl"
                name="controlPlaneUrl"
                type="url"
                placeholder="http://localhost:8080"
                required
                value={controlPlaneUrl}
                onChange={setControlPlaneUrl}
                className="w-full"
              />
            </div>

            <div>
              <label htmlFor="username" className="mono-label block mb-1">
                USERNAME
              </label>
              <Input
                id="username"
                name="username"
                type="text"
                required
                value={username}
                onChange={setUsername}
                className="w-full"
              />
            </div>

            <div>
              <label htmlFor="password" className="mono-label block mb-1">
                PASSWORD
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={setPassword}
                className="w-full"
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="glow"
            className="w-full"
            disabled={loading}
          >
            {loading ? "SIGNING IN..." : "SIGN IN WITH BASIC AUTH"}
          </Button>
        </form>

        {process.env.NEXT_PUBLIC_OIDC_ENABLED === "true" && (
          <>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t-2 border-white/20"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-black px-2 mono-label text-white/50">OR</span>
              </div>
            </div>

            <Button
              variant="secondary"
              className="w-full"
              onClick={handleOIDC}
              disabled={loading}
            >
              SIGN IN WITH SSO
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
