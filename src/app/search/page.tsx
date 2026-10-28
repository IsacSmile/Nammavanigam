import { Suspense } from "react";
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getDistrictsWithCounts, getTopDistricts } from "@/lib/locations";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SearchClient from "./SearchClient";

export const metadata: Metadata = {
  title: {
    absolute: "Search Business Listings in Tamil Nadu | Namma Vanigam",
  },
  description:
    "Filter and search verified local business listings, shops, services, and locations across Tamil Nadu.",
  alternates: {
    canonical: "/search",
  },
  openGraph: {
    title: "Search Business Listings in Tamil Nadu | Namma Vanigam",
    description:
      "Filter and search verified local business listings, shops, services, and locations across Tamil Nadu.",
    url: "/search",
    siteName: "Namma Vanigam",
    type: "website",
    images: [
      {
        url: "/namma-vaniga-logo.webp",
        width: 1264,
        height: 797,
        alt: "Search Businesses in Tamil Nadu - Namma Vanigam",
      },
    ],
  },
};

export const revalidate = 60; // Revalidate static data every 60 seconds

export default async function SearchPage() {
  // Fetch top-level categories with business count
  const categories = await prisma.category.findMany({
    where: { parentId: null, status: "active" },
    orderBy: { sortOrder: "asc" },
  });

  const categoriesWithCounts = await Promise.all(
    categories.map(async (cat: any) => {
      const count = await prisma.business.count({
        where: {
          status: "approved",
          OR: [{ categoryId: cat.id }, { category: { parentId: cat.id } }],
        },
      });
      return {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        count,
      };
    })
  );

  // Fetch 14 districts with rollup counts and taluk direct counts
  const districtsWithCounts = await getDistrictsWithCounts();
  districtsWithCounts.sort((a, b) => a.sortOrder - b.sortOrder);

  // Select 3 suggested categories for empty state
  const suggestedCategories = categories.slice(0, 3).map((cat: any) => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
  }));

  // Top 5 districts for footer
  const footerDistricts = await getTopDistricts(5);

  const footerCategories = categories.map((c: any) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
  }));

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col">
      <Header />

      <div className="flex-1">
        <Suspense
          fallback={
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 text-center text-xs font-semibold text-slate-500">
              Loading search directory...
            </div>
          }
        >
          <SearchClient
            initialCategories={categoriesWithCounts}
            initialDistricts={districtsWithCounts}
            suggestedCategories={suggestedCategories}
          />
        </Suspense>
      </div>

      <Footer categories={footerCategories} locations={footerDistricts} />
    </div>
  );
}
