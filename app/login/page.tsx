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
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Minato Control Plane</h1>
          <p className="mt-2 text-sm opacity-70">Sign in to manage your game servers</p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleBasicAuth} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="controlPlaneUrl" className="block text-sm font-medium">
                Control Plane URL
              </label>
              <Input
                id="controlPlaneUrl"
                name="controlPlaneUrl"
                type="url"
                placeholder="http://localhost:8080"
                required
                value={controlPlaneUrl}
                onChange={(e) => setControlPlaneUrl(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <label htmlFor="username" className="block text-sm font-medium">
                Username
              </label>
              <Input
                id="username"
                name="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium">
                Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In with Basic Auth"}
          </Button>
        </form>

        {process.env.NEXT_PUBLIC_OIDC_ENABLED === "true" && (
          <>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-[#0a0a0d] px-2 opacity-70">Or</span>
              </div>
            </div>

            <Button
              variant="secondary"
              className="w-full"
              onClick={handleOIDC}
              disabled={loading}
            >
              Sign In with SSO
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
