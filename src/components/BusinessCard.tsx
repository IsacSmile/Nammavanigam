"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MapPin, ShieldCheck, Star, ArrowRight, Building2 } from "lucide-react";

export interface BusinessCardProps {
  business: {
    id: number;
    name: string;
    slug: string;
    description?: string | null;
    verified?: boolean;
    featured?: boolean;
    category?: { name: string; slug?: string } | null;
    location?: {
      name: string;
      slug?: string;
      parent?: { name: string; slug?: string } | null;
    } | null;
    businessPhotos?: { imageUrl: string; altText?: string | null }[];
    businessHours?: { day: string; openingTime?: string | null; closingTime?: string | null; closed?: boolean }[];
    reviews?: { rating: number }[];
  };
}

export function getOpenStatus(businessHours?: any[] | null): { isOpen: boolean; label: string } | null {
  if (!businessHours || !Array.isArray(businessHours) || businessHours.length === 0) {
    return null;
  }

  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const now = new Date();
  const currentDay = days[now.getDay()];

  const todayRecord = businessHours.find(
    (h) => h.day && h.day.toLowerCase() === currentDay.toLowerCase()
  );

  if (!todayRecord) {
    return null;
  }

  if (todayRecord.closed) {
    return { isOpen: false, label: "Closed" };
  }

  if (!todayRecord.openingTime || !todayRecord.closingTime) {
    return null;
  }

  const parseTimeToMinutes = (timeStr: string): number | null => {
    if (!timeStr) return null;
    const str = timeStr.trim().toUpperCase();
    const isPM = str.includes("PM");
    const isAM = str.includes("AM");
    const cleanStr = str.replace(/(AM|PM)/g, "").trim();
    const parts = cleanStr.split(":");

    if (parts.length < 2) return null;
    let hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);

    if (isNaN(hours) || isNaN(minutes)) return null;

    if (isPM && hours < 12) hours += 12;
    if (isAM && hours === 12) hours = 0;

    return hours * 60 + minutes;
  };

  const openMinutes = parseTimeToMinutes(todayRecord.openingTime);
  const closeMinutes = parseTimeToMinutes(todayRecord.closingTime);

  if (openMinutes === null || closeMinutes === null) {
    return { isOpen: true, label: "Open Now" };
  }

  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  if (closeMinutes < openMinutes) {
    if (currentMinutes >= openMinutes || currentMinutes <= closeMinutes) {
      return { isOpen: true, label: "Open Now" };
    }
  } else {
    if (currentMinutes >= openMinutes && currentMinutes <= closeMinutes) {
      return { isOpen: true, label: "Open Now" };
    }
  }

  return { isOpen: false, label: "Closed" };
}

export default function BusinessCard({ business }: BusinessCardProps) {
  const [openStatus, setOpenStatus] = useState<{ isOpen: boolean; label: string } | null>(null);

  useEffect(() => {
    setOpenStatus(getOpenStatus(business.businessHours));
  }, [business.businessHours]);

  const photos = business.businessPhotos || [];
  const reviewsList = business.reviews || [];
  const reviewsCount = reviewsList.length;
  const avgRating =
    reviewsCount > 0
      ? (reviewsList.reduce((acc: number, r: any) => acc + Number(r.rating), 0) / reviewsCount).toFixed(1)
      : null;

  return (
    <div className="group bg-white rounded-xl sm:rounded-2xl border border-slate-200 hover:border-brand-blue hover:shadow-xl transition-all overflow-hidden flex flex-col justify-between">
      {/* Photo Grid / Strip */}
      <div className="h-28 sm:h-36 bg-slate-100 relative overflow-hidden">
        {photos.length === 0 ? (
          <div className="w-full h-full bg-brand-green-light text-brand-green flex flex-col items-center justify-center p-3">
            <Building2 className="w-8 h-8 text-brand-green mb-1" />
            <span className="text-[10px] font-bold text-slate-400">No Photo</span>
          </div>
        ) : photos.length === 1 ? (
          <img
            src={photos[0].imageUrl}
            alt={photos[0].altText || business.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : photos.length === 2 ? (
          <div className="grid grid-cols-2 gap-0.5 h-full w-full">
            <img
              src={photos[0].imageUrl}
              alt={photos[0].altText || business.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <img
              src={photos[1].imageUrl}
              alt={photos[1].altText || business.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-0.5 h-full w-full">
            <div className="col-span-2 h-full overflow-hidden">
              <img
                src={photos[0].imageUrl}
                alt={photos[0].altText || business.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="col-span-1 flex flex-col gap-0.5 h-full overflow-hidden">
              <div className="h-[calc(50%-1px)] w-full overflow-hidden">
                <img
                  src={photos[1].imageUrl}
                  alt={photos[1].altText || business.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="h-[calc(50%-1px)] w-full overflow-hidden">
                <img
                  src={photos[2].imageUrl}
                  alt={photos[2].altText || business.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            </div>
          </div>
        )}

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none z-10">
          {business.featured ? (
            <span className="px-2 py-0.5 rounded-full bg-amber-500/90 text-white font-extrabold text-[9px] sm:text-[10px] shadow backdrop-blur-xs flex items-center gap-1">
              <Star className="w-3 h-3 fill-white" /> Featured
            </span>
          ) : (
            <div />
          )}

          {business.verified && (
            <span className="p-1 rounded-full bg-emerald-600 text-white shadow" title="Verified Listing">
              <ShieldCheck className="w-3.5 h-3.5" />
            </span>
          )}
        </div>
      </div>

      {/* Card Body */}
      <div className="p-3.5 sm:p-4 space-y-2 flex-1 flex flex-col justify-between text-xs">
        <div className="space-y-1.5">
          {/* Metadata Row: Category + Location + Open/Closed status */}
          <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-bold">
            {business.category?.name && (
              <span className="text-brand-green uppercase tracking-wider bg-brand-green-light px-2 py-0.5 rounded text-[9px] sm:text-[10px]">
                {business.category.name}
              </span>
            )}
            {business.location?.name && (
              <span className="text-slate-500 flex items-center gap-0.5 text-[10px]">
                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                {business.location.parent?.name
                  ? `${business.location.name}, ${business.location.parent.name}`
                  : business.location.name}
              </span>
            )}
            {openStatus && (
              <span
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase border ${
                  openStatus.isOpen
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-slate-100 text-slate-600 border-slate-200"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    openStatus.isOpen ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                  }`}
                />
                {openStatus.label}
              </span>
            )}
            {reviewsCount > 0 && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200/80 shrink-0">
                <Star className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
                <span>{avgRating}</span>
                <span className="text-amber-700/80 font-semibold">({reviewsCount})</span>
              </span>
            )}
          </div>

          {/* Business Name */}
          <h3 className="font-extrabold text-brand-navy text-sm sm:text-base group-hover:text-brand-blue transition-colors line-clamp-1">
            {business.name}
          </h3>

          {/* Truncated Description */}
          <p className="text-slate-600 line-clamp-2 leading-relaxed text-[11px]">
            {business.description || "Top-rated business listing in Tamil Nadu."}
          </p>
        </div>

        {/* View Details Button */}
        <div className="pt-2.5 border-t border-slate-100">
          <Link
            href={`/business/${business.slug}`}
            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-50 group-hover:bg-brand-blue group-hover:text-white border border-slate-200 group-hover:border-brand-blue text-brand-navy font-bold rounded-lg sm:rounded-xl text-xs transition-all shadow-2xs"
          >
            <span>View Details</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
