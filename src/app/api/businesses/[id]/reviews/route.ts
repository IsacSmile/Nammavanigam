import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ userHasReviewed: false });
    }

    const businessId = Number(params.id);
    if (isNaN(businessId)) {
      return NextResponse.json({ error: "Invalid business ID." }, { status: 400 });
    }

    const [existingReview, userReports] = await Promise.all([
      (prisma as any).review.findUnique({
        where: {
          businessId_userId: {
            businessId,
            userId: Number(session.user.id),
          },
        },
        select: { id: true },
      }),
      (prisma as any).reviewReport.findMany({
        where: {
          reportedBy: Number(session.user.id),
          review: {
            businessId,
          },
        },
        select: {
          reviewId: true,
        },
      }),
    ]);

    const reportedReviewIds = (userReports || []).map((r: any) => r.reviewId);

    return NextResponse.json({
      userHasReviewed: Boolean(existingReview),
      reviewId: existingReview?.id || null,
      reportedReviewIds,
    });
  } catch (error: any) {
    console.error("Error checking review status:", error);
    return NextResponse.json(
      { error: error.message || "Failed to check review status." },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in to leave a review." },
        { status: 401 }
      );
    }

    const businessId = Number(params.id);
    if (isNaN(businessId)) {
      return NextResponse.json({ error: "Invalid business ID." }, { status: 400 });
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true, name: true },
    });

    if (!business) {
      return NextResponse.json({ error: "Business not found." }, { status: 404 });
    }

    const body = await request.json();
    const { rating, comment } = body;

    const parsedRating = Number(rating);
    if (
      isNaN(parsedRating) ||
      !Number.isInteger(parsedRating) ||
      parsedRating < 1 ||
      parsedRating > 5
    ) {
      return NextResponse.json(
        { error: "Rating must be an integer between 1 and 5." },
        { status: 400 }
      );
    }

    const userId = Number(session.user.id);

    try {
      const newReview = await (prisma as any).review.create({
        data: {
          businessId,
          userId,
          rating: parsedRating,
          comment: comment && typeof comment === "string" ? comment.trim() : null,
        },
      });

      return NextResponse.json(
        {
          success: true,
          reviewId: newReview.id,
          message: "Thank you for your review! Your review has been saved.",
        },
        { status: 201 }
      );
    } catch (dbErr: any) {
      if (dbErr.code === "P2002") {
        return NextResponse.json(
          { error: "You've already reviewed this business." },
          { status: 409 }
        );
      }
      throw dbErr;
    }
  } catch (error: any) {
    console.error("Error submitting review:", error);
    return NextResponse.json(
      { error: error.message || "Failed to submit review." },
      { status: 500 }
    );
  }
}
