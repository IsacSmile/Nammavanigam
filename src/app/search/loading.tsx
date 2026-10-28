import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { BusinessCardSkeleton } from "@/components/Skeletons";

export default function SearchLoading() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 w-full flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Filter Skeleton */}
          <div className="hidden lg:block lg:col-span-1 bg-white p-5 rounded-2xl border border-slate-200 h-[600px] animate-pulse space-y-6">
            <div className="h-6 w-3/4 bg-slate-200 rounded" />
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <div className="h-4 w-1/2 bg-slate-200 rounded" />
              <div className="h-4 w-full bg-slate-200 rounded" />
              <div className="h-4 w-full bg-slate-200 rounded" />
            </div>
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <div className="h-4 w-1/2 bg-slate-200 rounded" />
              <div className="h-4 w-full bg-slate-200 rounded" />
              <div className="h-4 w-full bg-slate-200 rounded" />
              <div className="h-4 w-full bg-slate-200 rounded" />
            </div>
          </div>

          {/* Results Grid Skeleton (6 Cards) */}
          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <BusinessCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
