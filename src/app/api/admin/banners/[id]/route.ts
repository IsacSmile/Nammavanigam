import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized. Admin role required." }, { status: 403 });
  }

  try {
    const id = Number(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid business ID." }, { status: 400 });
    }

    const business = await prisma.business.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, email: true } },
      },
    });

    if (!business) {
      return NextResponse.json({ error: "Business not found." }, { status: 404 });
    }

    const body = await request.json();
    const { action, rejectionReason } = body;

    if (action === "approve") {
      if (!business.bannerPendingUrl) {
        return NextResponse.json(
          { error: "No pending banner found to approve." },
          { status: 400 }
        );
      }

      const updated = await prisma.business.update({
        where: { id },
        data: {
          bannerUrl: business.bannerPendingUrl,
          bannerPendingUrl: null,
          bannerStatus: "approved",
          bannerRejectionReason: null,
        },
      });

      if (updated.slug) {
        try {
          revalidatePath(`/business/${updated.slug}`);
        } catch (err) {
          console.error("Revalidation error:", err);
        }
      }

      return NextResponse.json({
        success: true,
        business: updated,
      });
    }

    if (action === "reject") {
      if (!rejectionReason || !rejectionReason.trim()) {
        return NextResponse.json(
          { error: "Banner rejection reason is required." },
          { status: 400 }
        );
      }

      const updated = await prisma.business.update({
        where: { id },
        data: {
          bannerStatus: "rejected",
          bannerRejectionReason: rejectionReason.trim(),
          bannerPendingUrl: null,
        },
      });

      return NextResponse.json({
        success: true,
        business: updated,
      });
    }

    if (action === "remove") {
      if (!rejectionReason || !rejectionReason.trim()) {
        return NextResponse.json(
          { error: "Banner removal reason is required." },
          { status: 400 }
        );
      }

      const hasPending = Boolean(business.bannerPendingUrl);
      const updated = await prisma.business.update({
        where: { id },
        data: {
          bannerUrl: null,
          bannerRejectionReason: rejectionReason.trim(),
          bannerStatus: hasPending ? "pending" : "rejected",
        },
      });

      if (updated.slug) {
        try {
          revalidatePath(`/business/${updated.slug}`);
        } catch (err) {
          console.error("Revalidation error:", err);
        }
      }

      return NextResponse.json({
        success: true,
        business: updated,
      });
    }

    return NextResponse.json(
      { error: "Invalid action. Expected 'approve', 'reject', or 'remove'." },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Failed to process banner review:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process banner review." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  return PUT(request, { params });
}
