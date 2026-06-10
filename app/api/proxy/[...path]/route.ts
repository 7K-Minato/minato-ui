export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPrismaClient } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleProxy(request, params);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleProxy(request, params);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleProxy(request, params);
}

async function handleProxy(
  request: NextRequest,
  paramsPromise: Promise<{ path: string[] }>
) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { path } = await paramsPromise;
  const controlPlaneId = request.headers.get("X-Control-Plane-Id");

  let controlPlaneUrl: string;
  let credentials: Record<string, string> | null = null;

  if (controlPlaneId) {
    // Look up control plane from database
    const cp = await getPrismaClient().controlPlane.findUnique({
      where: { id: controlPlaneId },
    });

    if (!cp) {
      return NextResponse.json(
        { error: "Control plane not found" },
        { status: 404 }
      );
    }

    controlPlaneUrl = cp.url;
    if (cp.credentials) {
      try {
        credentials = JSON.parse(cp.credentials);
      } catch {
        // Invalid credentials format
      }
    }
  } else {
    // Fallback to session control plane URL
    controlPlaneUrl = session.user?.controlPlaneUrl as string;
    if (!controlPlaneUrl) {
      return NextResponse.json(
        { error: "No control plane configured" },
        { status: 400 }
      );
    }
  }

  const targetUrl = `${controlPlaneUrl}/${path.join("/")}`;

  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("X-Control-Plane-Id");

  // Set authorization based on auth mode
  if (session.user?.authMode === "oidc" && session.accessToken) {
    headers.set("Authorization", `Bearer ${session.accessToken}`);
  } else if (credentials?.username && credentials?.password) {
    headers.set(
      "Authorization",
      `Basic ${Buffer.from(`${credentials.username}:${credentials.password}`).toString("base64")}`
    );
  } else if (session.user?.name) {
    // Fallback to session credentials
    headers.set(
      "Authorization",
      `Basic ${Buffer.from(`${session.user.name}:`).toString("base64")}`
    );
  }

  try {
    const response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body:
        request.method !== "GET" && request.method !== "HEAD"
          ? await request.text()
          : undefined,
    });

    const data = await response.text();
    return new NextResponse(data, {
      status: response.status,
      headers: {
        "Content-Type":
          response.headers.get("Content-Type") || "application/json",
      },
    });
  } catch (error) {
    console.error("Proxy error:", error);
    return NextResponse.json(
      { error: "Failed to connect to control plane" },
      { status: 503 }
    );
  }
}
