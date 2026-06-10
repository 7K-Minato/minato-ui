export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getPrismaClient } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const controlPlane = await getPrismaClient().controlPlane.findUnique({
      where: { id },
    });

    if (!controlPlane) {
      return NextResponse.json(
        { error: "Control plane not found" },
        { status: 404 }
      );
    }

    // Check health endpoint
    const startTime = Date.now();
    const healthRes = await fetch(`${controlPlane.url}/healthz`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }).catch(() => null);

    const latency = Date.now() - startTime;

    // Check auth config
    let authConfig = null;
    try {
      const authRes = await fetch(`${controlPlane.url}/auth/config`);
      if (authRes.ok) {
        authConfig = await authRes.json();
      }
    } catch {
      // Auth config endpoint might not be available on older versions
    }

    const isHealthy = healthRes?.ok || false;

    return NextResponse.json({
      id: controlPlane.id,
      name: controlPlane.name,
      url: controlPlane.url,
      healthy: isHealthy,
      latency,
      authConfig,
      version: healthRes?.headers.get("x-minato-version") || "unknown",
    });
  } catch (error) {
    console.error("Failed to check control plane health:", error);
    return NextResponse.json(
      { error: "Failed to check health" },
      { status: 500 }
    );
  }
}
