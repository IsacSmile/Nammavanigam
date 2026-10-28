import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getTopDistricts } from "@/lib/locations";
import { safeJsonLd } from "@/lib/json-ld";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BusinessCard from "@/components/BusinessCard";
import {
  FolderTree,
  MapPin,
  Building2,
  ShieldCheck,
  Star,
  ArrowRight,
  Sparkles,
  ChevronRight,
} from "lucide-react";

export const revalidate = 60;

interface CategoryPageProps {
  params: { slug: string };
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const rawBaseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    (process.env.NEXTAUTH_URL && !process.env.NEXTAUTH_URL.includes("localhost")
      ? process.env.NEXTAUTH_URL
      : "https://nammavanigam.online");
  const baseUrl = rawBaseUrl.replace(/\/$/, "");
  const category = await prisma.category.findUnique({
    where: { slug: params.slug, status: "active" },
  });

  if (!category) {
    return {
      title: { absolute: "Category Not Found | Namma Vanigam" },
      description: "The requested business category could not be found.",
    };
  }

  const title = `Top ${category.name} in Tamil Nadu | Namma Vanigam`;
  const description =
    category.description ||
    `Browse verified ${category.name} listings, local shops, ratings, contact details, and locations across Tamil Nadu.`;

  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical: `/category/${category.slug}`,
    },
    openGraph: {
      title,
      description,
      url: `/category/${category.slug}`,
      siteName: "Namma Vanigam",
      type: "website",
    },
  };
}

export default async function CategoryLandingPage({ params }: CategoryPageProps) {
  const rawBaseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    (process.env.NEXTAUTH_URL && !process.env.NEXTAUTH_URL.includes("localhost")
      ? process.env.NEXTAUTH_URL
      : "https://nammavanigam.online");
  const baseUrl = rawBaseUrl.replace(/\/$/, "");

  const category = await prisma.category.findUnique({
    where: { slug: params.slug, status: "active" },
    include: {
      children: { where: { status: "active" } },
    },
  });

  if (!category) {
    notFound();
  }

  // Fetch approved businesses in category or subcategories
  const businesses = await prisma.business.findMany({
    where: {
      status: "approved",
      OR: [{ categoryId: category.id }, { category: { parentId: category.id } }],
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

  // Footer data
  const allCategories = await prisma.category.findMany({
    where: { parentId: null, status: "active" },
    take: 8,
  });
  const footerDistricts = await getTopDistricts(5);

  // Schema.org BreadcrumbList JSON-LD
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
      {
        "@type": "ListItem",
        position: 2,
        name: "Categories",
        item: `${baseUrl}/#popular-categories`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: category.name,
        item: `${baseUrl}/category/${category.slug}`,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col">
      {/* Inject BreadcrumbList JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbJsonLd) }}
      />

      <Header />

      {/* Category Hero Header */}
      <section className="bg-gradient-to-r from-brand-navy via-slate-900 to-brand-navy text-white py-12 px-4 sm:px-6 border-b border-slate-800">
        <div className="max-w-7xl mx-auto space-y-4">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <Link href="/" className="hover:text-emerald-400 transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
            <Link href="/search" className="hover:text-emerald-400 transition-colors">
              Categories
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-emerald-400 font-bold">{category.name}</span>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                <FolderTree className="w-3.5 h-3.5 text-emerald-400" />
                <span>Verified Business Category</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                {category.name} in Tamil Nadu
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
                {category.description || `Browse top rated ${category.name} companies and local services in Tamil Nadu.`}
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 text-xs text-slate-200">
              <strong className="text-white text-base">{businesses.length}</strong> {businesses.length === 1 ? "Approved Listing" : "Approved Listings"}
            </div>
          </div>

          {/* Subcategories Pills if any */}
          {category.children && category.children.length > 0 && (
            <div className="pt-4 border-t border-white/10 flex items-center gap-2 flex-wrap text-xs">
              <span className="text-slate-400 font-bold text-[11px] uppercase">Subcategories:</span>
              {category.children.map((sub: any) => (
                <Link
                  key={sub.id}
                  href={`/category/${sub.slug}`}
                  className="px-3 py-1 rounded-full bg-white/10 hover:bg-emerald-500 hover:text-white text-slate-200 font-semibold text-xs transition-all border border-white/10"
                >
                  {sub.name}
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
            <div className="w-16 h-16 bg-brand-green-light text-brand-green rounded-full flex items-center justify-center mx-auto">
              <Building2 className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-brand-navy">No Listings in {category.name} Yet</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Be the first local business to list under <strong>{category.name}</strong> in Tamil Nadu!
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
