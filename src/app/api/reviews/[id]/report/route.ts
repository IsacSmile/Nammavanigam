import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const reviewId = parseInt(params.id, 10);
    if (isNaN(reviewId)) {
      return NextResponse.json(
        { error: "Invalid review ID" },
        { status: 400 }
      );
    }

    const userId = (session.user as any).id;
    if (!userId) {
      return NextResponse.json(
        { error: "Invalid user session" },
        { status: 401 }
      );
    }

    const review = await (prisma as any).review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404 }
      );
    }

    if (review.userId === Number(userId)) {
      return NextResponse.json(
        { error: "You cannot report your own review" },
        { status: 400 }
      );
    }

    const existingReport = await (prisma as any).reviewReport.findUnique({
      where: {
        reviewId_reportedBy: {
          reviewId,
          reportedBy: Number(userId),
        },
      },
    });

    if (existingReport) {
      return NextResponse.json(
        { error: "You've already reported this review" },
        { status: 409 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const reason = typeof body.reason === "string" && body.reason.trim() ? body.reason.trim() : null;

    try {
      await (prisma as any).reviewReport.create({
        data: {
          reviewId,
          reportedBy: Number(userId),
          reason,
        },
      });

      return NextResponse.json(
        { message: "Report submitted successfully" },
        { status: 201 }
      );
    } catch (dbErr: any) {
      if (dbErr.code === "P2002") {
        return NextResponse.json(
          { error: "You've already reported this review" },
          { status: 409 }
        );
      }
      throw dbErr;
    }
  } catch (error) {
    console.error("Error submitting review report:", error);
    return NextResponse.json(
      { error: "Failed to submit report" },
      { status: 500 }
    );
  }
}
