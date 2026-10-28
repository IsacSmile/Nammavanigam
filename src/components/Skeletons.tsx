import React from "react";

// 1. BusinessCardSkeleton: Matches exact layout & dimensions of BusinessCard.tsx
export function BusinessCardSkeleton() {
  return (
    <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 overflow-hidden flex flex-col justify-between animate-pulse">
      {/* Photo Grid Placeholder */}
      <div className="h-28 sm:h-36 bg-slate-200 relative overflow-hidden" />

      {/* Card Body Placeholder */}
      <div className="p-3.5 sm:p-4 space-y-3 flex-1 flex flex-col justify-between">
        <div className="space-y-2">
          {/* Metadata Row Placeholder */}
          <div className="flex items-center gap-2">
            <div className="h-4 w-16 bg-slate-200 rounded" />
            <div className="h-4 w-20 bg-slate-200 rounded" />
          </div>

          {/* Title Placeholder */}
          <div className="h-5 w-3/4 bg-slate-200 rounded" />

          {/* Description Lines Placeholder */}
          <div className="space-y-1.5 pt-1">
            <div className="h-3 w-full bg-slate-200 rounded" />
            <div className="h-3 w-4/5 bg-slate-200 rounded" />
          </div>
        </div>

        {/* View Details Button Placeholder */}
        <div className="pt-2.5 border-t border-slate-100">
          <div className="h-8 w-full bg-slate-200 rounded-lg sm:rounded-xl" />
        </div>
      </div>
    </div>
  );
}

// 2. CategoryCardSkeleton: Matches exact 2-col mobile / 4-col desktop category cards
export function CategoryCardSkeleton() {
  return (
    <div className="bg-white p-3.5 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-200 flex flex-col justify-between space-y-3 sm:space-y-4 animate-pulse">
      {/* Top Row: Icon + Count Pill Placeholder */}
      <div className="flex items-start justify-between">
        <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-slate-200" />
        <div className="h-5 w-16 bg-slate-200 rounded-full" />
      </div>

      {/* Bottom Text Block Placeholder */}
      <div className="space-y-2">
        <div className="h-5 w-2/3 bg-slate-200 rounded" />
        <div className="h-3 w-1/2 bg-slate-200 rounded" />
      </div>
    </div>
  );
}

// 3. LocationCardSkeleton: Matches Explore by Location cards
export function LocationCardSkeleton() {
  return (
    <div className="bg-white p-4 rounded-xl sm:rounded-2xl border border-slate-200 flex items-center justify-between space-x-3 animate-pulse">
      <div className="space-y-2 flex-1">
        <div className="h-4 w-28 bg-slate-200 rounded" />
        <div className="h-3 w-16 bg-slate-200 rounded" />
      </div>
      <div className="w-6 h-6 rounded-full bg-slate-200 shrink-0" />
    </div>
  );
}

// 4. HeroCardSkeleton: Matches 2x2 showcase cards in hero section
export function HeroCardSkeleton({ heightClass = "h-44 sm:h-52 lg:h-60" }: { heightClass?: string }) {
  return (
    <div
      className={`relative rounded-2xl overflow-hidden bg-slate-200 animate-pulse ${heightClass} border border-slate-200 flex flex-col justify-between p-3.5 sm:p-4`}
    >
      {/* Top Floating Logo Badge Skeleton */}
      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-300/80" />

      {/* Bottom Text Lines Skeleton */}
      <div className="space-y-2">
        <div className="h-3 w-20 bg-slate-300/90 rounded" />
        <div className="h-4.5 w-32 bg-slate-300/90 rounded" />
        <div className="h-3 w-24 bg-slate-300/80 rounded" />
      </div>
    </div>
  );
}

// 5. HeroSectionSkeleton: Matches full homepage hero section (Left Search + Right 2x2 Showcase Grid)
export function HeroSectionSkeleton() {
  return (
    <section className="bg-white text-slate-800 pt-8 pb-12 sm:pt-12 sm:pb-16 lg:pt-16 lg:pb-20 px-4 sm:px-6 lg:px-8 border-b border-slate-100">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-7 space-y-6 sm:space-y-7">
          {/* Badge Skeleton */}
          <div className="h-7 w-56 bg-slate-200 rounded-full animate-pulse" />

          {/* Heading Skeleton */}
          <div className="space-y-3">
            <div className="h-10 sm:h-12 w-4/5 bg-slate-200 rounded-xl animate-pulse" />
            <div className="h-10 sm:h-12 w-3/5 bg-slate-200 rounded-xl animate-pulse" />
          </div>

          {/* Subheading Skeleton */}
          <div className="space-y-2 max-w-xl">
            <div className="h-4 w-full bg-slate-200 rounded animate-pulse" />
            <div className="h-4 w-4/5 bg-slate-200 rounded animate-pulse" />
          </div>

          {/* Search Bar Skeleton */}
          <div className="h-14 sm:h-16 w-full max-w-2xl bg-slate-200 rounded-2xl sm:rounded-full animate-pulse" />

          {/* Quick Filters Skeleton */}
          <div className="flex items-center gap-2 pt-1 flex-wrap">
            <div className="h-4 w-24 bg-slate-200 rounded animate-pulse mr-1" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-7 w-28 bg-slate-200 rounded-full animate-pulse" />
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN - 2x2 SHOWCASE GRID SKELETON */}
        <div className="lg:col-span-5 mt-4 lg:mt-0">
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:gap-5">
            {/* Column 1 of Grid */}
            <div className="space-y-3 sm:space-y-4 lg:space-y-5">
              <HeroCardSkeleton />
              <HeroCardSkeleton />
            </div>

            {/* Column 2 of Grid with desktop offset */}
            <div className="space-y-3 sm:space-y-4 lg:space-y-5 lg:pt-8">
              <HeroCardSkeleton />
              <HeroCardSkeleton />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
