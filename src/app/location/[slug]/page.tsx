import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { resolveLocationSlug, getTopDistricts, getLocationListingCounts } from "@/lib/locations";
import { safeJsonLd } from "@/lib/json-ld";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BusinessCard from "@/components/BusinessCard";
import {
  MapPin,
  Building2,
  ChevronRight,
} from "lucide-react";

export const revalidate = 60;

interface LocationPageProps {
  params: { slug: string };
}

export async function generateMetadata({
  params,
}: LocationPageProps): Promise<Metadata> {
  const resolved = await resolveLocationSlug(params.slug);

  if (!resolved) {
    return {
      title: { absolute: "Location Not Found | Namma Vanigam" },
      description: "The requested location could not be found.",
    };
  }

  const { isDistrict, location, district } = resolved;
  const title = isDistrict
    ? `Top Businesses & Services in ${location.name}, Tamil Nadu | Namma Vanigam`
    : `Top Businesses & Services in ${location.name}, ${district.name} | Namma Vanigam`;

  const description = isDistrict
    ? `Find verified local businesses, shops, services, doctors, and restaurants across ${location.name}, Tamil Nadu. Browse ratings, phone numbers, and addresses.`
    : `Find verified local businesses, shops, services, doctors, and restaurants in ${location.name}, ${district.name}, Tamil Nadu. Browse ratings, phone numbers, and addresses.`;

  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical: `/location/${location.slug}`,
    },
    openGraph: {
      title,
      description,
      url: `/location/${location.slug}`,
      siteName: "Namma Vanigam",
      type: "website",
    },
  };
}

export default async function LocationLandingPage({ params }: LocationPageProps) {
  const rawBaseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    (process.env.NEXTAUTH_URL && !process.env.NEXTAUTH_URL.includes("localhost")
      ? process.env.NEXTAUTH_URL
      : "https://nammavanigam.online");
  const baseUrl = rawBaseUrl.replace(/\/$/, "");

  const resolved = await resolveLocationSlug(params.slug);
  if (!resolved) {
    notFound();
  }

  const { isDistrict, location, district, taluk, locationIds } = resolved;

  // Fetch approved businesses in the covered location ids (district covers itself + taluks; taluk covers itself)
  const businesses = await prisma.business.findMany({
    where: {
      status: "approved",
      locationId: { in: locationIds },
    },
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
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
      businessPhotos: { take: 3, orderBy: { sortOrder: "asc" } },
      businessHours: true,
      reviews: { select: { rating: true } },
    } as any,
  });

  // If district, fetch its active locations with listing counts for "Browse by location" row
  let districtTaluksWithCounts: Array<{ id: number; name: string; slug: string; count: number }> = [];
  if (isDistrict) {
    const { directCounts } = await getLocationListingCounts();
    const taluks = await prisma.location.findMany({
      where: { parentId: location.id, status: "active" },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, slug: true },
    });
    districtTaluksWithCounts = taluks.map((t) => ({
      ...t,
      count: directCounts.get(t.id) || 0,
    }));
  }

  // Footer data
  const allCategories = await prisma.category.findMany({
    where: { parentId: null, status: "active" },
    take: 8,
  });
  const footerDistricts = await getTopDistricts(5);

  // Schema.org BreadcrumbList JSON-LD
  const breadcrumbItems = isDistrict
    ? [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: baseUrl,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Locations",
          item: `${baseUrl}/search`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: district.name,
          item: `${baseUrl}/location/${district.slug}`,
        },
      ]
    : [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: baseUrl,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: district.name,
          item: `${baseUrl}/location/${district.slug}`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: taluk!.name,
          item: `${baseUrl}/location/${taluk!.slug}`,
        },
      ];

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbItems,
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col">
      {/* Inject BreadcrumbList JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbJsonLd) }}
      />

      <Header />

      {/* Location Hero Header */}
      <section className="bg-gradient-to-r from-brand-navy via-slate-900 to-brand-navy text-white py-12 px-4 sm:px-6 border-b border-slate-800">
        <div className="max-w-7xl mx-auto space-y-4">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <Link href="/" className="hover:text-emerald-400 transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
            {isDistrict ? (
              <>
                <Link href="/search" className="hover:text-emerald-400 transition-colors">
                  Locations
                </Link>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-emerald-400 font-bold">{district.name}</span>
              </>
            ) : (
              <>
                <Link href={`/location/${district.slug}`} className="hover:text-emerald-400 transition-colors">
                  {district.name}
                </Link>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-emerald-400 font-bold">{taluk!.name}</span>
              </>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-blue/30 text-brand-blue-light text-xs font-bold border border-brand-blue/40">
                <MapPin className="w-3.5 h-3.5 text-brand-blue" />
                <span>{isDistrict ? "District in Tamil Nadu" : `Location in ${district.name}`}</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                {isDistrict
                  ? `Businesses in ${district.name}, Tamil Nadu`
                  : `Businesses in ${taluk!.name}, ${district.name}`}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
                {isDistrict
                  ? `Discover verified shops, medical services, restaurants, and professionals located across ${district.name} district.`
                  : `Discover verified shops, medical services, restaurants, and professionals located in ${taluk!.name}, ${district.name}.`}
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 text-xs text-slate-200">
              <strong className="text-white text-base">{businesses.length}</strong>{" "}
              {businesses.length === 1 ? "Approved Listing" : "Approved Listings"}
            </div>
          </div>

          {/* Browse by location row if District */}
          {isDistrict && districtTaluksWithCounts.length > 0 && (
            <div className="pt-4 border-t border-white/10 flex items-center gap-2 flex-wrap text-xs">
              <span className="text-slate-400 font-bold text-[11px] uppercase">Browse by location:</span>
              {districtTaluksWithCounts.map((sub) => (
                <Link
                  key={sub.id}
                  href={`/location/${sub.slug}`}
                  className="px-3 py-1 rounded-full bg-white/10 hover:bg-brand-blue hover:text-white text-slate-200 font-semibold text-xs transition-all border border-white/10 inline-flex items-center gap-1.5"
                >
                  <span>{sub.name}</span>
                  <span className="text-[10px] text-slate-400 bg-white/10 px-1.5 py-0.2 rounded font-mono">
                    {sub.count}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Main Content Listings Grid */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-12 w-full space-y-8">
        {businesses.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-4 max-w-md mx-auto">
            <div className="w-16 h-16 bg-brand-blue-light text-brand-blue rounded-full flex items-center justify-center mx-auto">
              <MapPin className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-brand-navy">No Listings in {location.name} Yet</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              {isDistrict
                ? `Be the first local business to register in ${location.name}, Tamil Nadu!`
                : `Be the first local business to register in ${location.name}, ${district.name}!`}
            </p>
            <Link
              href="/add-business"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-green hover:bg-brand-green-hover text-white font-bold rounded-xl text-xs transition-colors shadow-sm"
            >
              Add Your Business
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {businesses.map((biz: any) => (
              <BusinessCard key={biz.id} business={biz} />
            ))}
          </div>
        )}
      </main>

      <Footer categories={allCategories} locations={footerDistricts} />
    </div>
  );
}
