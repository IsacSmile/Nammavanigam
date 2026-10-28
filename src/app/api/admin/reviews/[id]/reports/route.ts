import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || (session.user as any).role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    const reviewId = parseInt(params.id, 10);
    if (isNaN(reviewId)) {
      return NextResponse.json(
        { error: "Invalid review ID" },
        { status: 400 }
      );
    }

    // Delete all review_reports associated with this review ID
    await (prisma as any).reviewReport.deleteMany({
      where: { reviewId },
    });

    return NextResponse.json({ message: "Reports dismissed successfully" });
  } catch (error) {
    console.error("Error dismissing review reports:", error);
    return NextResponse.json(
      { error: "Failed to dismiss reports" },
      { status: 500 }
    );
  }
}
