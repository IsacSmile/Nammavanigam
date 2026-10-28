import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  HeroSectionSkeleton,
  CategoryCardSkeleton,
  BusinessCardSkeleton,
  LocationCardSkeleton,
} from "@/components/Skeletons";

export default function HomepageLoading() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col">
      <Header />
      
      {/* Hero Section Skeleton (Left Search + Right 2x2 Showcase Grid) */}
      <HeroSectionSkeleton />

      <main className="flex-1 space-y-16 pb-20">
        {/* Popular Categories Section Skeleton */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-8 border-b border-slate-200/80 pb-4">
            <div className="space-y-2">
              <div className="h-8 w-64 bg-slate-200 rounded animate-pulse" />
              <div className="h-4 w-48 bg-slate-200 rounded animate-pulse" />
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <CategoryCardSkeleton key={i} />
            ))}
          </div>
        </section>

        {/* Featured Businesses Section Skeleton */}
        <section className="bg-white py-12 border-y border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-8 border-b border-slate-100 pb-4">
              <div className="space-y-2">
                <div className="h-8 w-64 bg-slate-200 rounded animate-pulse" />
                <div className="h-4 w-48 bg-slate-200 rounded animate-pulse" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <BusinessCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </section>

        {/* Explore by Location Section Skeleton */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-8 border-b border-slate-200 pb-4">
            <div className="space-y-2">
              <div className="h-8 w-64 bg-slate-200 rounded animate-pulse" />
              <div className="h-4 w-48 bg-slate-200 rounded animate-pulse" />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <LocationCardSkeleton key={i} />
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
