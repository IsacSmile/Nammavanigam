import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || (session.user as any).role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    const reportedReviews = await (prisma as any).review.findMany({
      where: {
        reports: {
          some: {},
        },
      },
      include: {
        business: {
          select: { id: true, name: true, slug: true },
        },
        user: {
          select: { id: true, name: true, email: true },
        },
        reports: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ reportedReviews });
  } catch (error) {
    console.error("Error fetching reported reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch reported reviews" },
      { status: 500 }
    );
  }
}
