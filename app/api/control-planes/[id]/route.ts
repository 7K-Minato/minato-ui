export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getPrismaClient } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(
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

    return NextResponse.json({
      ...controlPlane,
      credentials: undefined,
    });
  } catch (error) {
    console.error("Failed to fetch control plane:", error);
    return NextResponse.json(
      { error: "Failed to fetch control plane" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { name, url, authType, credentials, isDefault } = body;

    // If setting as default, unset other defaults
    if (isDefault) {
      await getPrismaClient().controlPlane.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    const controlPlane = await getPrismaClient().controlPlane.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(url && { url }),
        ...(authType && { authType }),
        ...(credentials && { credentials: JSON.stringify(credentials) }),
        ...(isDefault !== undefined && { isDefault }),
      },
    });

    return NextResponse.json({
      ...controlPlane,
      credentials: undefined,
    });
  } catch (error) {
    console.error("Failed to update control plane:", error);
    return NextResponse.json(
      { error: "Failed to update control plane" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    await getPrismaClient().controlPlane.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete control plane:", error);
    return NextResponse.json(
      { error: "Failed to delete control plane" },
      { status: 500 }
    );
  }
}
