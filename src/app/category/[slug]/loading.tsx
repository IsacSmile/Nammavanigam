import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { BusinessCardSkeleton } from "@/components/Skeletons";

export default function CategoryLoading() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col">
      <Header />
      <div className="bg-[#000B4D] py-10 sm:py-14 animate-pulse">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-3">
          <div className="h-8 w-64 bg-white/20 rounded" />
          <div className="h-4 w-96 bg-white/10 rounded" />
        </div>
      </div>
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-12 w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <BusinessCardSkeleton key={i} />
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
