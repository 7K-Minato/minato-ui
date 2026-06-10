export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getPrismaClient } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const controlPlanes = await getPrismaClient().controlPlane.findMany({
      orderBy: { createdAt: "desc" },
    });

    // Don't return credentials in the response
    const sanitized = controlPlanes.map((cp) => ({
      ...cp,
      credentials: undefined,
    }));

    return NextResponse.json(sanitized);
  } catch (error) {
    console.error("Failed to fetch control planes:", error);
    return NextResponse.json(
      { error: "Failed to fetch control planes" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, url, authType, credentials, isDefault } = body;

    if (!name || !url || !authType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await getPrismaClient().controlPlane.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    const controlPlane = await getPrismaClient().controlPlane.create({
      data: {
        name,
        url,
        authType,
        credentials: credentials ? JSON.stringify(credentials) : null,
        isDefault: isDefault || false,
      },
    });

    return NextResponse.json(
      { ...controlPlane, credentials: undefined },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create control plane:", error);
    return NextResponse.json(
      { error: "Failed to create control plane" },
      { status: 500 }
    );
  }
}
