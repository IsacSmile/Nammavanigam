import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const rawBaseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    (process.env.NEXTAUTH_URL && !process.env.NEXTAUTH_URL.includes("localhost")
      ? process.env.NEXTAUTH_URL
      : "https://nammavanigam.online");
  const baseUrl = rawBaseUrl.replace(/\/$/, "");

  // Static routes
  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/add-business`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/register`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  try {
    // 1. Approved Businesses
    const businesses = await prisma.business.findMany({
      where: { status: "approved" },
      select: { slug: true, createdAt: true },
    });

    const businessRoutes: MetadataRoute.Sitemap = businesses.map((biz) => ({
      url: `${baseUrl}/business/${biz.slug}`,
      lastModified: biz.createdAt || new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    // 2. Active Categories
    const categories = await prisma.category.findMany({
      where: { status: "active" },
      select: { slug: true },
    });

    const categoryRoutes: MetadataRoute.Sitemap = categories.map((cat) => ({
      url: `${baseUrl}/category/${cat.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    // 3. Active Locations: All 38 Tamil Nadu districts and 313 taluks
    const locations = await prisma.location.findMany({
      where: { status: "active" },
      select: { slug: true, parentId: true },
    });

    const locationRoutes: MetadataRoute.Sitemap = locations.map((loc) => ({
      url: `${baseUrl}/location/${loc.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: loc.parentId === null ? 0.8 : 0.7,
    }));

    return [...routes, ...categoryRoutes, ...locationRoutes, ...businessRoutes];
  } catch (error) {
    console.error("Failed to generate sitemap entries:", error);
    return routes;
  }
}
