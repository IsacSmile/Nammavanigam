import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { normalizeSocialUrl } from "@/lib/contact";
import { safeJsonLd } from "@/lib/json-ld";
import BusinessProfileClient from "./BusinessProfileClient";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const business = await prisma.business.findFirst({
    where: {
      slug: params.slug,
      status: "approved",
    },
    include: {
      location: { include: { parent: true } },
      category: true,
      businessPhotos: { take: 1, orderBy: { sortOrder: "asc" } },
    },
  });

  if (!business) {
    return {
      title: { absolute: "Business Listing Not Found | Namma Vanigam" },
      description: "The requested business listing does not exist or has not been approved yet.",
    };
  }

  const locStr = (business.location as any)?.parent
    ? `${business.location.name}, ${(business.location as any).parent.name}`
    : business.location.name;
  const inLocStr = locStr.endsWith("Tamil Nadu") ? locStr : `${locStr}, Tamil Nadu`;
  const title = `${business.name} - ${locStr} | Namma Vanigam`;
  const description =
    business.description?.slice(0, 160) ||
    `Find details, contact information, services, photo gallery, and directions for ${business.name} in ${inLocStr}.`;
  const ogImage = business.businessPhotos[0]?.imageUrl || undefined;

  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical: `/business/${business.slug}`,
    },
    openGraph: {
      title,
      description,
      url: `/business/${business.slug}`,
      images: ogImage ? [{ url: ogImage, alt: business.name }] : [],
      type: "website",
      siteName: "Namma Vanigam",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImage ? [ogImage] : [],
    },
  };
}

export default async function BusinessProfilePage({
  params,
}: {
  params: { slug: string };
}) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ? Number(session.user.id) : null;
  const isAdminUser = session?.user?.role === "admin";

  const business = await prisma.business.findFirst({
    where: {
      slug: params.slug,
      status: "approved",
    },
    include: {
      category: true,
      location: {
        include: {
          parent: true,
        },
      },
      owner: {
        select: { id: true, name: true, email: true, phone: true },
      },
      businessServices: true,
      businessPhotos: {
        orderBy: { sortOrder: "asc" },
      },
      businessHours: true,
      businessPhones: {
        select: { number: true, label: true },
        orderBy: { sortOrder: "asc" },
      },
      businessSocialLinks: {
        select: { platform: true, url: true },
        orderBy: { platform: "asc" },
      },
      reviews: {
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { id: true, name: true },
          },
        },
      },
    } as any,
  });

  if (!business) {
    notFound();
  }

  const isOwner = userId !== null && business.ownerId === userId;
  const canSeeInternalBanner = isOwner || isAdminUser;

  // Fetch 4 related approved businesses in the same category
  const relatedBusinesses = await prisma.business.findMany({
    where: {
      categoryId: business.categoryId,
      status: "approved",
      id: { not: business.id },
    },
    take: 4,
    include: {
      category: { select: { id: true, name: true, slug: true } },
      location: {
        select: {
          id: true,
          name: true,
          slug: true,
          parent: { select: { id: true, name: true, slug: true } },
        },
      },
      businessPhotos: { take: 1, orderBy: { sortOrder: "asc" } },
      reviews: { select: { rating: true } },
    } as any,
    orderBy: { createdAt: "desc" },
  });

  // Convert Prisma Decimal object to plain string for client serialization
  const servicesList = (business as any).businessServices || [];
  const formattedServices = servicesList.map((svc: any) => ({
    ...svc,
    price: svc.price ? svc.price.toString() : null,
  }));

  const {
    bannerPendingUrl,
    bannerStatus,
    bannerRejectionReason,
    bannerSubmittedAt,
    ...safeBusiness
  } = business as any;

  const formattedBusiness = {
    ...safeBusiness,
    businessServices: formattedServices,
    ...(canSeeInternalBanner
      ? {
          bannerPendingUrl,
          bannerStatus,
          bannerRejectionReason,
          bannerSubmittedAt,
        }
      : {}),
  };

  const sanitizedRelatedBusinesses = relatedBusinesses.map((b: any) => {
    const {
      bannerPendingUrl,
      bannerStatus,
      bannerRejectionReason,
      bannerSubmittedAt,
      ...rest
    } = b;
    return rest;
  });

  const rawBaseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    (process.env.NEXTAUTH_URL && !process.env.NEXTAUTH_URL.includes("localhost")
      ? process.env.NEXTAUTH_URL
      : "https://nammavanigam.online");
  const baseUrl = rawBaseUrl.replace(/\/$/, "");

  const bAny = business as any;
  const validatedSocialUrls = (bAny.businessSocialLinks || [])
    .map((s: any) => normalizeSocialUrl(s.platform, s.url))
    .filter((res: any) => res.success && res.url)
    .map((res: any) => res.url as string);

  const locStr = bAny.location?.parent
    ? `${bAny.location.name}, ${bAny.location.parent.name}`
    : bAny.location?.name;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: baseUrl,
      },
      ...(bAny.category
        ? [
            {
              "@type": "ListItem",
              position: 2,
              name: bAny.category.name,
              item: `${baseUrl}/category/${bAny.category.slug}`,
            },
            {
              "@type": "ListItem",
              position: 3,
              name: bAny.name,
              item: `${baseUrl}/business/${bAny.slug}`,
            },
          ]
        : [
            {
              "@type": "ListItem",
              position: 2,
              name: bAny.name,
              item: `${baseUrl}/business/${bAny.slug}`,
            },
          ]),
    ],
  };

  const localBusinessJsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${baseUrl}/business/${bAny.slug}`,
    name: bAny.name,
    url: `${baseUrl}/business/${bAny.slug}`,
    description: bAny.description || undefined,
    image: bAny.businessPhotos?.[0]?.imageUrl || undefined,
    telephone: bAny.phone || undefined,
    email: bAny.email || undefined,
    priceRange: "₹₹",
    ...(bAny.latitude && bAny.longitude
      ? {
          geo: {
            "@type": "GeoCoordinates",
            latitude: bAny.latitude,
            longitude: bAny.longitude,
          },
        }
      : {}),
    address: bAny.address
      ? {
          "@type": "PostalAddress",
          streetAddress: bAny.address,
          addressLocality: locStr || "Tamil Nadu",
          addressRegion: "Tamil Nadu",
          addressCountry: "IN",
        }
      : undefined,
    ...(validatedSocialUrls.length > 0 ? { sameAs: validatedSocialUrls } : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(localBusinessJsonLd) }}
      />
      <BusinessProfileClient
        business={formattedBusiness as any}
        relatedBusinesses={sanitizedRelatedBusinesses as any}
      />
    </>
  );
}
