import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/auth";

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized. Admin role required." }, { status: 403 });
  }

  try {
    const { items } = await request.json();
    if (!Array.isArray(items)) {
      return NextResponse.json({ error: "Items array is required" }, { status: 400 });
    }

    const updatePromises = items.map((item: { id: number; sortOrder: number }) =>
      prisma.location.update({
        where: { id: Number(item.id) },
        data: { sortOrder: Number(item.sortOrder) },
      })
    );

    await prisma.$transaction(updatePromises);

    return NextResponse.json({ success: true, count: items.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to reorder locations" }, { status: 500 });
  }
}
