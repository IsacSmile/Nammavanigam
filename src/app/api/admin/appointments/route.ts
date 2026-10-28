import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json(
      { error: "Unauthorized. Admin role required." },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);

    // If countOnly=true, return { pending }
    if (searchParams.get("countOnly") === "true") {
      const pending = await prisma.appointment.count({
        where: { status: "pending" },
      });
      return NextResponse.json({ pending });
    }

    const statusParam = searchParams.get("status") || "all";
    const pageParam = parseInt(searchParams.get("page") || "1", 10);
    const page = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;
    const pageSize = 20;
    const skip = (page - 1) * pageSize;

    const whereClause: { status?: "pending" | "handled" } = {};
    if (statusParam === "pending") {
      whereClause.status = "pending";
    } else if (statusParam === "handled") {
      whereClause.status = "handled";
    }

    const [totalAll, totalPending, totalHandled, items] = await Promise.all([
      prisma.appointment.count(),
      prisma.appointment.count({ where: { status: "pending" } }),
      prisma.appointment.count({ where: { status: "handled" } }),
      prisma.appointment.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        select: {
          id: true,
          name: true,
          phone: true,
          appointmentDate: true,
          appointmentTime: true,
          message: true,
          status: true,
          createdAt: true,
          // CRITICAL: Never select ipHash
        },
      }),
    ]);

    const total =
      statusParam === "pending"
        ? totalPending
        : statusParam === "handled"
        ? totalHandled
        : totalAll;

    return NextResponse.json({
      items,
      total,
      counts: {
        all: totalAll,
        pending: totalPending,
        handled: totalHandled,
      },
    });
  } catch (error: any) {
    console.error("[GET /api/admin/appointments] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch appointments." },
      { status: 500 }
    );
  }
}
