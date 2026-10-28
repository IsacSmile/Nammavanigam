import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { isValidCloudinaryUrl } from "@/lib/cloudinary-url";
import { resolveLocationSlug } from "@/lib/locations";
import {
  validateAdditionalPhones,
  validateSocialLinks,
  sanitizePhoneLabel,
  SocialPlatform,
} from "@/lib/contact";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() || "";
    const categorySlug = searchParams.get("category")?.trim() || "";
    const locationSlug = searchParams.get("location")?.trim() || "";
    const verified = searchParams.get("verified");
    const featured = searchParams.get("featured");

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(50, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    const where: any = {
      status: "approved",
    };

    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { address: { contains: q, mode: "insensitive" } },
      ];
    }

    if (verified === "true") {
      where.verified = true;
    }

    if (featured === "true") {
      where.featured = true;
    }

    // Filter by category slug if provided
    if (categorySlug) {
      const categoryObj = await prisma.category.findUnique({
        where: { slug: categorySlug, status: "active" },
        include: {
          children: {
            where: { status: "active" },
            select: { id: true },
          },
        },
      });

      if (categoryObj) {
        const catIds = [categoryObj.id, ...categoryObj.children.map((c) => c.id)];
        where.categoryId = { in: catIds };
      } else {
        // Category slug doesn't match any existing category -> empty results
        return NextResponse.json({
          businesses: [],
          total: 0,
          page,
          totalPages: 0,
          limit,
        });
      }
    }

    // Filter by location slug if provided
    if (locationSlug) {
      const resolved = await resolveLocationSlug(locationSlug);
      if (resolved && resolved.locationIds.length > 0) {
        where.locationId = { in: resolved.locationIds };
      } else {
        // Location slug doesn't match any active location -> empty results
        return NextResponse.json({
          businesses: [],
          total: 0,
          page,
          totalPages: 0,
          limit,
        });
      }
    }

    const [total, businesses] = await Promise.all([
      prisma.business.count({ where }),
      prisma.business.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
        include: {
          category: { select: { id: true, name: true, slug: true } },
          location: {
            select: {
              id: true,
              name: true,
              slug: true,
              parentId: true,
              parent: { select: { id: true, name: true, slug: true } },
            },
          },
          businessPhotos: { take: 3, orderBy: { sortOrder: "asc" } },
          businessHours: true,
          reviews: { select: { rating: true } },
        } as any,
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    // Sanitize businesses so public visitors never receive internal banner review fields
    const sanitizedBusinesses = businesses.map((b: any) => {
      const {
        bannerPendingUrl,
        bannerStatus,
        bannerRejectionReason,
        bannerSubmittedAt,
        ...rest
      } = b;
      return rest;
    });

    return NextResponse.json({
      businesses: sanitizedBusinesses,
      total,
      page,
      totalPages,
      limit,
    });
  } catch (error: any) {
    console.error("Failed to fetch search businesses:", error);
    return NextResponse.json(
      { error: error.message || "Failed to search businesses" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to list your business." },
        { status: 401 }
      );
    }

    const userId = Number(session.user.id);
    const body = await req.json();

    const {
      name,
      categoryId,
      locationId,
      description,
      street,
      area,
      pincode,
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
      bannerUrl,
      bannerPendingUrl,
      additionalPhones,
      socialLinks,
    } = body;

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

    // Parallel lookup of location and current user
    const [targetLoc, currentUser] = await Promise.all([
      prisma.location.findUnique({
        where: { id: Number(locationId) },
        select: { id: true, parentId: true, name: true, status: true },
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true },
      }),
    ]);

    if (!targetLoc || targetLoc.status !== "active") {
      return NextResponse.json({ error: "Selected location does not exist or is inactive." }, { status: 400 });
    }

    // Validate banner URL if present
    const bannerCandidate = bannerPendingUrl || bannerUrl;
    if (bannerCandidate && typeof bannerCandidate === "string" && bannerCandidate.trim()) {
      if (!isValidCloudinaryUrl(bannerCandidate.trim())) {
        return NextResponse.json(
          { error: "Invalid banner image URL. Only images hosted on this project's Cloudinary cloud are allowed." },
          { status: 400 }
        );
      }
    }

    // Validate logo URL if present
    if (logoUrl && typeof logoUrl === "string" && logoUrl.trim()) {
      if (!isValidCloudinaryUrl(logoUrl.trim())) {
        return NextResponse.json(
          { error: "Invalid logo image URL. Only images hosted on this project's Cloudinary cloud are allowed." },
          { status: 400 }
        );
      }
    }

    // Validate gallery photo URLs if present
    if (Array.isArray(photoUrls)) {
      for (const url of photoUrls) {
        if (url && typeof url === "string" && url.trim()) {
          if (!isValidCloudinaryUrl(url.trim())) {
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
      const phoneVal = validateAdditionalPhones(additionalPhones, phone);
      if (!phoneVal.valid) {
        return NextResponse.json({ error: phoneVal.error }, { status: 400 });
      }
    }

    // Validate social links if present
    let validatedSocials: Array<{ platform: SocialPlatform; url: string }> = [];
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

    // Generate unique slug
    let baseSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    if (!baseSlug) baseSlug = "business";

    let slug = baseSlug;
    let slugExists = await prisma.business.findUnique({
      where: { slug },
      select: { id: true },
    });
    let counter = 1;
    while (slugExists) {
      slug = `${baseSlug}-${counter}`;
      slugExists = await prisma.business.findUnique({
        where: { slug },
        select: { id: true },
      });
      counter++;
    }

    // Construct address string
    const fullAddress = [street, area, pincode].filter(Boolean).map((s) => s.trim()).join(", ");

    // Prepare relation records outside the transaction
    const validServices =
      Array.isArray(services) && services.length > 0
        ? services
            .filter((s: any) => s && s.serviceName && s.serviceName.trim())
            .map((s: any) => ({
              serviceName: s.serviceName.trim(),
              description: s.description?.trim() || null,
              price: s.price ? parseFloat(String(s.price)) : null,
              imageUrl:
                typeof s.imageUrl === "string" && s.imageUrl.trim()
                  ? s.imageUrl.trim()
                  : null,
            }))
        : [];

    const hoursData =
      Array.isArray(businessHours) && businessHours.length > 0
        ? businessHours.map((h: any) => ({
            day: h.day,
            openingTime: h.closed ? null : h.openingTime || null,
            closingTime: h.closed ? null : h.closingTime || null,
            closed: Boolean(h.closed),
          }))
        : [];

    const photoRecords: Array<{ imageUrl: string; altText: string; sortOrder: number }> = [];
    if (logoUrl && typeof logoUrl === "string" && logoUrl.trim()) {
      photoRecords.push({
        imageUrl: logoUrl.trim(),
        altText: `${name.trim()} Logo`,
        sortOrder: 0,
      });
    }
    if (Array.isArray(photoUrls) && photoUrls.length > 0) {
      photoUrls
        .filter((url: any) => typeof url === "string" && url.trim())
        .slice(0, 8)
        .forEach((url: string, idx: number) => {
          photoRecords.push({
            imageUrl: url.trim(),
            altText: `${name.trim()} Photo ${idx + 1}`,
            sortOrder: idx + 1,
          });
        });
    }

    const phoneRecords =
      Array.isArray(additionalPhones) && additionalPhones.length > 0
        ? additionalPhones.map((p: any, idx: number) => ({
            number: p.number.trim(),
            label: sanitizePhoneLabel(p.label) || null,
            sortOrder: idx,
          }))
        : [];

    const socialRecords =
      validatedSocials.length > 0
        ? validatedSocials.map((s) => ({
            platform: s.platform,
            url: s.url,
          }))
        : [];

    const shouldUpgradeRole = currentUser?.role === "user";

    // Execute Prisma transaction with explicit timeout options (writes only)
    const newBusiness = await prisma.$transaction(
      async (tx: any) => {
        // 1. Create Business row
        const business = await tx.business.create({
          data: {
            ownerId: userId,
            name: name.trim(),
            slug,
            categoryId: Number(categoryId),
            locationId: Number(locationId),
            description: description?.trim() || null,
            address: fullAddress || null,
            latitude: latitude ? parseFloat(String(latitude)) : null,
            longitude: longitude ? parseFloat(String(longitude)) : null,
            phone: phone?.trim() || null,
            whatsapp: whatsapp?.trim() || null,
            email: email?.trim() || null,
            website: website?.trim() || null,
            status: "pending",
            verified: false,
            featured: false,
            bannerUrl: null,
            bannerPendingUrl:
              bannerCandidate && typeof bannerCandidate === "string" && bannerCandidate.trim()
                ? bannerCandidate.trim()
                : null,
            bannerStatus:
              bannerCandidate && typeof bannerCandidate === "string" && bannerCandidate.trim()
                ? "pending"
                : "none",
            bannerSubmittedAt:
              bannerCandidate && typeof bannerCandidate === "string" && bannerCandidate.trim()
                ? new Date()
                : null,
            bannerRejectionReason: null,
          },
        });

        // 2. Add Services if present
        if (validServices.length > 0) {
          await tx.businessService.createMany({
            data: validServices.map((s) => ({ ...s, businessId: business.id })),
          });
        }

        // 3. Add Business Hours if present
        if (hoursData.length > 0) {
          await tx.businessHour.createMany({
            data: hoursData.map((h) => ({ ...h, businessId: business.id })),
          });
        }

        // 4. Add Photos if present
        if (photoRecords.length > 0) {
          await tx.businessPhoto.createMany({
            data: photoRecords.map((p) => ({ ...p, businessId: business.id })),
          });
        }

        // 5. Add Additional Phones if present
        if (phoneRecords.length > 0) {
          await tx.businessPhone.createMany({
            data: phoneRecords.map((p) => ({ ...p, businessId: business.id })),
          });
        }

        // 6. Add Social Links if present
        if (socialRecords.length > 0) {
          await tx.businessSocialLink.createMany({
            data: socialRecords.map((s) => ({ ...s, businessId: business.id })),
          });
        }

        // 7. Upgrade User role to business_owner if currently user
        if (shouldUpgradeRole) {
          await tx.user.update({
            where: { id: userId },
            data: { role: "business_owner" },
          });
        }

        return business;
      },
      { maxWait: 10000, timeout: 30000 }
    );

    return NextResponse.json(
      {
        success: true,
        businessId: newBusiness.id,
        name: newBusiness.name,
        slug: newBusiness.slug,
        status: newBusiness.status,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating business:", error);
    return NextResponse.json(
      { error: "Could not save changes. Please try again." },
      { status: 500 }
    );
  }
}
