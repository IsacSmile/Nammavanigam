import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { isValidCloudinaryUrl } from "@/lib/cloudinary-url";
import {
  validateAdditionalPhones,
  validateSocialLinks,
  sanitizePhoneLabel,
  SocialPlatform,
} from "@/lib/contact";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const businessId = Number(params.id);
    if (isNaN(businessId)) {
      return NextResponse.json({ error: "Invalid business ID." }, { status: 400 });
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: {
        category: true,
        location: {
          include: { parent: true },
        },
        businessPhotos: {
          orderBy: { sortOrder: "asc" },
        },
        businessServices: true,
        businessHours: true,
        businessPhones: {
          orderBy: { sortOrder: "asc" },
        },
        businessSocialLinks: {
          orderBy: { platform: "asc" },
        },
        owner: {
          select: { id: true, name: true, email: true, phone: true, role: true },
        },
      },
    });

    if (!business) {
      return NextResponse.json({ error: "Business not found." }, { status: 404 });
    }

    const userId = Number(session.user.id);
    const isAdminUser = session.user.role === "admin";
    const isOwner = business.ownerId === userId;

    if (!isOwner && !isAdminUser) {
      return NextResponse.json(
        { error: "Forbidden. You do not have permission to view or edit this business." },
        { status: 403 }
      );
    }

    return NextResponse.json(business);
  } catch (error: any) {
    console.error("Error fetching business details:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch business details." },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const businessId = Number(params.id);
    if (isNaN(businessId)) {
      return NextResponse.json({ error: "Invalid business ID." }, { status: 400 });
    }

    const body = await request.json();
    const {
      name,
      categoryId,
      locationId,
      description,
      street,
      area,
      pincode,
      address,
      latitude,
      longitude,
      phone,
      whatsapp,
      email,
      website,
      services,
      businessHours,
      logoUrl,
      photoUrls,
      bannerPendingUrl,
      removeBanner,
      additionalPhones,
      socialLinks,
    } = body;

    // Parallel lookup of existing business (with photos and services) and location
    const [existingBusiness, targetLoc] = await Promise.all([
      prisma.business.findUnique({
        where: { id: businessId },
        include: {
          businessPhotos: true,
          businessServices: true,
        },
      }),
      locationId
        ? prisma.location.findUnique({
            where: { id: Number(locationId) },
            select: { id: true, parentId: true, name: true, status: true },
          })
        : Promise.resolve(null),
    ]);

    if (!existingBusiness) {
      return NextResponse.json({ error: "Business not found." }, { status: 404 });
    }

    const userId = Number(session.user.id);
    const isAdminUser = session.user.role === "admin";
    const isOwner = existingBusiness.ownerId === userId;

    if (!isOwner && !isAdminUser) {
      return NextResponse.json(
        { error: "Forbidden. You do not have permission to edit this business." },
        { status: 403 }
      );
    }

    if (removeBanner === true && !isOwner && !isAdminUser) {
      return NextResponse.json(
        { error: "Forbidden. Only the listing owner or an admin may remove the banner." },
        { status: 403 }
      );
    }

    // Basic Validation
    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Business name is required." }, { status: 400 });
    }
    if (!categoryId) {
      return NextResponse.json({ error: "Category selection is required." }, { status: 400 });
    }
    if (!locationId) {
      return NextResponse.json({ error: "Location selection is required." }, { status: 400 });
    }

    if (!targetLoc || targetLoc.status !== "active") {
      return NextResponse.json({ error: "Selected location does not exist or is inactive." }, { status: 400 });
    }

    // Validate banner URL if present
    if (bannerPendingUrl !== undefined && typeof bannerPendingUrl === "string" && bannerPendingUrl.trim()) {
      if (!isValidCloudinaryUrl(bannerPendingUrl.trim())) {
        return NextResponse.json(
          { error: "Invalid banner image URL. Only images hosted on this project's Cloudinary cloud are allowed." },
          { status: 400 }
        );
      }
    }

    // Validate logo and gallery photo URLs:
    // Only validate URLs that are NOT already stored for this business, so unchanged existing photos never block an edit.
    const existingPhotoUrls = new Set<string>();
    if (Array.isArray(existingBusiness.businessPhotos)) {
      for (const p of existingBusiness.businessPhotos) {
        if (p.imageUrl) existingPhotoUrls.add(p.imageUrl.trim());
      }
    }

    if (logoUrl && typeof logoUrl === "string" && logoUrl.trim()) {
      const trimmedLogo = logoUrl.trim();
      if (!existingPhotoUrls.has(trimmedLogo) && !isValidCloudinaryUrl(trimmedLogo)) {
        return NextResponse.json(
          { error: "Invalid logo image URL. Only images hosted on this project's Cloudinary cloud are allowed." },
          { status: 400 }
        );
      }
    }

    if (Array.isArray(photoUrls)) {
      for (const url of photoUrls) {
        if (url && typeof url === "string" && url.trim()) {
          const trimmedUrl = url.trim();
          if (!existingPhotoUrls.has(trimmedUrl) && !isValidCloudinaryUrl(trimmedUrl)) {
            return NextResponse.json(
              { error: "Invalid gallery photo URL. Only images hosted on this project's Cloudinary cloud are allowed." },
              { status: 400 }
            );
          }
        }
      }
    }

    // Validate service image URLs if present
    if (Array.isArray(services)) {
      for (const s of services) {
        if (s && typeof s.imageUrl === "string" && s.imageUrl.trim()) {
          if (!isValidCloudinaryUrl(s.imageUrl.trim())) {
            return NextResponse.json(
              {
                error: `Invalid image URL for service "${s.serviceName || "Unnamed"}". Only images hosted on this project's Cloudinary cloud are allowed.`,
              },
              { status: 400 }
            );
          }
        }
      }
    }

    // Validate additional phones if present
    if (additionalPhones !== undefined) {
      if (!Array.isArray(additionalPhones)) {
        return NextResponse.json({ error: "additionalPhones must be an array." }, { status: 400 });
      }
      const effectivePrimaryPhone = phone !== undefined ? phone : existingBusiness.phone;
      const phoneVal = validateAdditionalPhones(additionalPhones, effectivePrimaryPhone);
      if (!phoneVal.valid) {
        return NextResponse.json({ error: phoneVal.error }, { status: 400 });
      }
    }

    // Validate social links if present
    let validatedSocials: Array<{ platform: SocialPlatform; url: string }> | undefined = undefined;
    if (socialLinks !== undefined) {
      if (!Array.isArray(socialLinks)) {
        return NextResponse.json({ error: "socialLinks must be an array." }, { status: 400 });
      }
      const socialVal = validateSocialLinks(socialLinks);
      if (!socialVal.valid) {
        return NextResponse.json({ error: socialVal.error }, { status: 400 });
      }
      validatedSocials = socialVal.data || [];
    }

    // Construct full address string
    let fullAddress = address ? String(address).trim() : "";
    if (!fullAddress) {
      fullAddress = [street, area, pincode].filter(Boolean).map((s: string) => String(s).trim()).join(", ");
    }

    // Status behavior:
    // 1. If currently "rejected", reset to "pending" and clear rejectionReason (re-enters review queue)
    // 2. If currently "approved" or "pending", preserve status
    let statusToSet = existingBusiness.status;
    let rejectionReasonToSet = existingBusiness.rejectionReason;
    if (existingBusiness.status === "rejected") {
      statusToSet = "pending";
      rejectionReasonToSet = null;
    }

    // Prepare update payload for Business record
    const businessUpdateData: any = {
      name: name.trim(),
      categoryId: Number(categoryId),
      locationId: Number(locationId),
      description: description?.trim() || null,
      address: fullAddress || null,
      latitude:
        latitude !== null && latitude !== undefined && !isNaN(parseFloat(String(latitude)))
          ? parseFloat(String(latitude))
          : null,
      longitude:
        longitude !== null && longitude !== undefined && !isNaN(parseFloat(String(longitude)))
          ? parseFloat(String(longitude))
          : null,
      phone: phone?.trim() || null,
      whatsapp: whatsapp?.trim() || null,
      email: email?.trim() || null,
      website: website?.trim() || null,
      status: statusToSet,
      rejectionReason: rejectionReasonToSet,
      ...(removeBanner === true
        ? {
            bannerUrl: null,
            ...(bannerPendingUrl !== undefined &&
            typeof bannerPendingUrl === "string" &&
            bannerPendingUrl.trim()
              ? {
                  bannerPendingUrl: bannerPendingUrl.trim(),
                  bannerStatus: "pending",
                  bannerSubmittedAt: new Date(),
                  bannerRejectionReason: null,
                }
              : existingBusiness.bannerPendingUrl && bannerPendingUrl !== null
              ? {
                  bannerStatus: "pending",
                }
              : {
                  bannerPendingUrl: null,
                  bannerStatus: "none",
                  bannerRejectionReason: null,
                  bannerSubmittedAt: null,
                }),
          }
        : bannerPendingUrl !== undefined
        ? typeof bannerPendingUrl === "string" && bannerPendingUrl.trim()
          ? {
              bannerPendingUrl: bannerPendingUrl.trim(),
              bannerStatus: "pending",
              bannerSubmittedAt: new Date(),
              bannerRejectionReason: null,
            }
          : {
              bannerPendingUrl: null,
              bannerSubmittedAt: null,
              bannerRejectionReason: null,
              bannerStatus: existingBusiness.bannerUrl ? "approved" : "none",
            }
        : existingBusiness.status === "rejected" && existingBusiness.bannerPendingUrl
        ? {
            bannerStatus: "pending",
            bannerRejectionReason: null,
          }
        : {}),
    };

    // Prepare relation records outside the transaction
    let validServices: Array<{
      businessId: number;
      serviceName: string;
      description: string | null;
      price: number | null;
      imageUrl: string | null;
    }> | null = null;

    if (services !== undefined) {
      const existingMapById = new Map<number, string | null>();
      for (const es of existingBusiness.businessServices || []) {
        existingMapById.set(es.id, es.imageUrl);
      }

      validServices = Array.isArray(services)
        ? services
            .filter((s: any) => s && s.serviceName && s.serviceName.trim())
            .map((s: any) => {
              let finalImageUrl: string | null = null;
              if (typeof s.imageUrl === "string" && s.imageUrl.trim()) {
                finalImageUrl = s.imageUrl.trim();
              } else if (s.imageUrl === undefined) {
                if (s.id && existingMapById.has(Number(s.id))) {
                  finalImageUrl = existingMapById.get(Number(s.id)) || null;
                } else {
                  finalImageUrl = null;
                }
              } else {
                finalImageUrl = null;
              }

              return {
                businessId,
                serviceName: s.serviceName.trim(),
                description: s.description?.trim() || null,
                price:
                  s.price !== null && s.price !== undefined && s.price !== "" && !isNaN(parseFloat(String(s.price)))
                    ? parseFloat(String(s.price))
                    : null,
                imageUrl: finalImageUrl,
              };
            })
        : [];
    }

    let hoursData: Array<{
      businessId: number;
      day: string;
      openingTime: string | null;
      closingTime: string | null;
      closed: boolean;
    }> | null = null;

    if (businessHours !== undefined) {
      hoursData = Array.isArray(businessHours)
        ? businessHours.map((h: any) => ({
            businessId,
            day: h.day,
            openingTime: h.closed ? null : h.openingTime || null,
            closingTime: h.closed ? null : h.closingTime || null,
            closed: Boolean(h.closed),
          }))
        : [];
    }

    const shouldUpdatePhotos = logoUrl !== undefined || photoUrls !== undefined;
    let photoRecords: Array<{
      businessId: number;
      imageUrl: string;
      altText: string;
      sortOrder: number;
    }> | null = null;

    if (shouldUpdatePhotos) {
      photoRecords = [];
      const trimmedName = name.trim();

      if (logoUrl && typeof logoUrl === "string" && logoUrl.trim()) {
        photoRecords.push({
          businessId,
          imageUrl: logoUrl.trim(),
          altText: `${trimmedName} Logo`,
          sortOrder: 0,
        });
      }

      if (Array.isArray(photoUrls) && photoUrls.length > 0) {
        photoUrls
          .filter((url: any) => typeof url === "string" && url.trim())
          .slice(0, 8)
          .forEach((url: string, idx: number) => {
            photoRecords!.push({
              businessId,
              imageUrl: url.trim(),
              altText: `${trimmedName} Photo ${idx + 1}`,
              sortOrder: idx + 1,
            });
          });
      }
    }

    let phoneRecords: Array<{
      businessId: number;
      number: string;
      label: string | null;
      sortOrder: number;
    }> | null = null;

    if (additionalPhones !== undefined) {
      phoneRecords = Array.isArray(additionalPhones)
        ? additionalPhones.map((p: any, idx: number) => ({
            businessId,
            number: p.number.trim(),
            label: sanitizePhoneLabel(p.label) || null,
            sortOrder: idx,
          }))
        : [];
    }

    let socialRecords: Array<{
      businessId: number;
      platform: SocialPlatform;
      url: string;
    }> | null = null;

    if (socialLinks !== undefined && validatedSocials !== undefined) {
      socialRecords = validatedSocials.map((s) => ({
        businessId,
        platform: s.platform,
        url: s.url,
      }));
    }

    // Transaction to update business record & relations (writes only, with explicit timeout options)
    const updatedBusiness = await prisma.$transaction(
      async (tx) => {
        // 1. Update business fields
        const biz = await tx.business.update({
          where: { id: businessId },
          data: businessUpdateData,
        });

        // 2. Services: replace-all when provided, leave unchanged when undefined
        if (validServices !== null) {
          await tx.businessService.deleteMany({
            where: { businessId },
          });
          if (validServices.length > 0) {
            await tx.businessService.createMany({
              data: validServices,
            });
          }
        }

        // 3. Business Hours: replace-all when provided, leave unchanged when undefined
        if (hoursData !== null) {
          await tx.businessHour.deleteMany({
            where: { businessId },
          });
          if (hoursData.length > 0) {
            await tx.businessHour.createMany({
              data: hoursData,
            });
          }
        }

        // 4. Photos: replace-all when provided, leave unchanged when undefined
        if (photoRecords !== null) {
          await tx.businessPhoto.deleteMany({
            where: { businessId },
          });
          if (photoRecords.length > 0) {
            await tx.businessPhoto.createMany({
              data: photoRecords,
            });
          }
        }

        // 5. Additional Phones: replace-all when provided, leave unchanged when undefined
        if (phoneRecords !== null) {
          await tx.businessPhone.deleteMany({
            where: { businessId },
          });
          if (phoneRecords.length > 0) {
            await tx.businessPhone.createMany({
              data: phoneRecords,
            });
          }
        }

        // 6. Social Links: replace-all when provided, leave unchanged when undefined
        if (socialRecords !== null) {
          await tx.businessSocialLink.deleteMany({
            where: { businessId },
          });
          if (socialRecords.length > 0) {
            await tx.businessSocialLink.createMany({
              data: socialRecords,
            });
          }
        }

        return biz;
      },
      { maxWait: 10000, timeout: 30000 }
    );

    const targetSlug = updatedBusiness.slug || existingBusiness.slug;
    if (targetSlug) {
      try {
        revalidatePath(`/business/${targetSlug}`);
      } catch (err) {
        console.error("Revalidation error:", err);
      }
    }

    return NextResponse.json({
      success: true,
      businessId: updatedBusiness.id,
      name: updatedBusiness.name,
      slug: updatedBusiness.slug,
      status: updatedBusiness.status,
    });
  } catch (error: any) {
    console.error("Error updating business:", error);
    return NextResponse.json(
      { error: "Could not save changes. Please try again." },
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
