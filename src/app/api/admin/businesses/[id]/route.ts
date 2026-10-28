import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized. Admin role required." }, { status: 403 });
  }

  try {
    const id = Number(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid business ID" }, { status: 400 });
    }

    const business = await prisma.business.findUnique({
      where: { id },
      include: {
        category: true,
        location: {
          include: { parent: true },
        },
        owner: {
          select: { id: true, name: true, email: true, phone: true, role: true },
        },
        businessServices: true,
        businessPhotos: {
          orderBy: { sortOrder: "asc" },
        },
        businessHours: true,
      },
    });

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    return NextResponse.json(business);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch business" }, { status: 500 });
  }
}

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
      return NextResponse.json({ error: "Invalid business ID" }, { status: 400 });
    }

    const body = await request.json();
    const {
      status,
      rejectionReason,
      featured,
      showcaseOrder,
      verified,
      name,
      categoryId,
      locationId,
      description,
      address,
      phone,
      email,
      website,
      rejectBanner,
      bannerAction,
      bannerRejectionReason,
    } = body;

    const existing = await prisma.business.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const dataToUpdate: any = {};

    if (status !== undefined) {
      dataToUpdate.status = status;
      if (status === "rejected") {
        dataToUpdate.rejectionReason = rejectionReason || null;
      } else if (status === "approved") {
        dataToUpdate.rejectionReason = null;

        // Handle banner promotion or rejection during listing approval
        const isRejectingBanner = rejectBanner === true || bannerAction === "reject";
        if (isRejectingBanner) {
          if (!bannerRejectionReason || !bannerRejectionReason.trim()) {
            return NextResponse.json(
              { error: "Banner rejection reason is required." },
              { status: 400 }
            );
          }
          dataToUpdate.bannerStatus = "rejected";
          dataToUpdate.bannerRejectionReason = bannerRejectionReason.trim();
          dataToUpdate.bannerPendingUrl = null;
        } else if (existing.bannerPendingUrl) {
          // Promote banner in the same database transaction/update
          dataToUpdate.bannerUrl = existing.bannerPendingUrl;
          dataToUpdate.bannerPendingUrl = null;
          dataToUpdate.bannerStatus = "approved";
          dataToUpdate.bannerRejectionReason = null;
        }
      }
    }

    if (rejectionReason !== undefined && status === "rejected") {
      dataToUpdate.rejectionReason = rejectionReason;
    }

    if (featured !== undefined) {
      dataToUpdate.featured = Boolean(featured);
    }

    if (showcaseOrder !== undefined) {
      if (showcaseOrder === null || showcaseOrder === "" || isNaN(Number(showcaseOrder))) {
        dataToUpdate.showcaseOrder = null;
      } else {
        dataToUpdate.showcaseOrder = Number(showcaseOrder);
      }
    }

    if (verified !== undefined) {
      dataToUpdate.verified = Boolean(verified);
    }

    if (name !== undefined && name.trim()) {
      dataToUpdate.name = name.trim();
    }
    if (categoryId !== undefined) {
      dataToUpdate.categoryId = Number(categoryId);
    }
    if (locationId !== undefined) {
      const parsedLocId = Number(locationId);
      const loc = await prisma.location.findUnique({
        where: { id: parsedLocId },
        select: { id: true, status: true },
      });
      if (!loc || loc.status !== "active") {
        return NextResponse.json(
          { error: "Selected location does not exist or is inactive." },
          { status: 400 }
        );
      }
      dataToUpdate.locationId = parsedLocId;
    }
    if (description !== undefined) {
      dataToUpdate.description = description ? description.trim() : null;
    }
    if (address !== undefined) {
      dataToUpdate.address = address ? address.trim() : null;
    }
    if (phone !== undefined) {
      dataToUpdate.phone = phone ? phone.trim() : null;
    }
    if (email !== undefined) {
      dataToUpdate.email = email ? email.trim() : null;
    }
    if (website !== undefined) {
      dataToUpdate.website = website ? website.trim() : null;
    }

    const updated = await prisma.business.update({
      where: { id },
      data: dataToUpdate,
      include: {
        category: true,
        location: {
          include: { parent: true },
        },
        owner: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (updated.status === "approved" && updated.slug) {
      try {
        revalidatePath(`/business/${updated.slug}`);
      } catch (err) {
        console.error("Revalidation error:", err);
      }
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Failed to update business:", error);
    return NextResponse.json({ error: error.message || "Failed to update business" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  return PUT(request, { params });
}
