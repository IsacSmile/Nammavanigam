"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, ShieldCheck, ChevronDown, Check } from "lucide-react";
import SearchAutocompleteDropdown, { useAutocomplete } from "./SearchAutocompleteDropdown";
import { HeroCardSkeleton } from "./Skeletons";

export interface LocationOption {
  id: number;
  name: string;
  slug: string;
}

export interface BusinessPhoto {
  id?: number;
  imageUrl: string;
  altText?: string | null;
  sortOrder?: number;
}

export interface BusinessProp {
  id: number;
  name: string;
  slug: string;
  category?: { name: string; slug: string } | null;
  location?: { name: string; slug: string } | null;
  businessPhotos?: BusinessPhoto[];
}

export interface QuickFilterChip {
  label: string;
  categorySlug: string;
  districtSlug: string;
  count?: number;
}

interface HeroSearchProps {
  locations: LocationOption[];
  featuredBusinesses?: BusinessProp[];
  categories?: { id: number; name: string; slug: string }[];
  quickFilterChips?: QuickFilterChip[];
}

interface CardData {
  id: string | number;
  name: string;
  categoryName: string;
  locationName: string;
  imageUrl: string;
  logoUrl?: string | null;
  slug?: string;
  query?: string;
}

const DEFAULT_QUICK_FILTERS: QuickFilterChip[] = [
  { label: "Healthcare Malappuram", categorySlug: "healthcare", districtSlug: "malappuram" },
  { label: "Other Businesses Malappuram", categorySlug: "other", districtSlug: "malappuram" },
  { label: "Other Businesses Ernakulam", categorySlug: "other", districtSlug: "ernakulam" },
  { label: "Other Businesses Thrissur", categorySlug: "other", districtSlug: "thrissur" },
];

const DEFAULT_HERO_CARDS: CardData[] = [
  {
    id: "default-1",
    name: "Niha Tech Solutions",
    categoryName: "WEB DESIGN",
    locationName: "Kanayannur, Ernakulam",
    imageUrl: "/images/dummy-web-design.jpg",
    logoUrl: "/images/dummy-niha-logo.svg",
    query: "Niha Tech Solutions",
  },
  {
    id: "default-2",
    name: "Namma Craft Coffee House",
    categoryName: "CAFES & COFFEE SHOPS",
    locationName: "Mylapore, Chennai",
    imageUrl: "/images/dummy-coffee-house.jpg",
    query: "Namma Craft Coffee House",
  },
  {
    id: "default-3",
    name: "Grand Heritage Resort &...",
    categoryName: "HOTELS, TRAVEL & TOURISM",
    locationName: "Coimbatore, Tamil Nadu",
    imageUrl: "/images/dummy-resort.jpg",
    query: "Grand Heritage Resort",
  },
  {
    id: "default-4",
    name: "Lumiere Luxury Hair &...",
    categoryName: "SALONS",
    locationName: "Guindy, Chennai",
    imageUrl: "/images/dummy-salon.jpg",
    query: "Lumiere Luxury Hair",
  },
];

export default function HeroSearch({
  locations,
  featuredBusinesses = [],
  categories = [],
  quickFilterChips = [],
}: HeroSearchProps) {
  const router = useRouter();
  const [keyword, setKeyword] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const locationContainerRef = useRef<HTMLDivElement>(null);
  const { suggestions, isLoading, isOpen, setIsOpen } = useAutocomplete(keyword);

  const selectedLocationObj = locations.find((l) => l.slug === selectedLocation);
  const displayLocationName = selectedLocationObj ? selectedLocationObj.name : "All Tamil Nadu";

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
      if (locationContainerRef.current && !locationContainerRef.current.contains(e.target as Node)) {
        setLocationDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setIsOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsOpen(false);
    const params = new URLSearchParams();
    if (keyword.trim()) {
      params.set("q", keyword.trim());
    }
    if (selectedLocation) {
      params.set("location", selectedLocation);
    }
    router.push(`/search?${params.toString()}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const activeChips =
    quickFilterChips && quickFilterChips.length > 0
      ? quickFilterChips
      : DEFAULT_QUICK_FILTERS;

  // Build hero cards directly from DB featured businesses (limit 4)
  const heroCards: CardData[] =
    featuredBusinesses && featuredBusinesses.length > 0
      ? featuredBusinesses.map((biz, idx) => {
          const photos = biz.businessPhotos || [];
          // Logo photo (sortOrder === 0 or altText containing "logo")
          const logoPhoto = photos.find(
            (p) => p.sortOrder === 0 || (p.altText && p.altText.toLowerCase().includes("logo"))
          );
          // Real showcase background photo (sortOrder > 0 or altText not containing "logo")
          const bgPhoto = photos.find(
            (p) => (p.sortOrder && p.sortOrder > 0) || (p.altText && !p.altText.toLowerCase().includes("logo"))
          );

          const fallbackCard = DEFAULT_HERO_CARDS[idx % DEFAULT_HERO_CARDS.length];
          const finalBgUrl = bgPhoto?.imageUrl || fallbackCard.imageUrl;
          const finalLogoUrl = logoPhoto?.imageUrl || fallbackCard.logoUrl || null;

          const districtName = (biz.location as any)?.parent?.name;
          const talukName = biz.location?.name;
          const locationName =
            talukName && districtName
              ? `${talukName}, ${districtName}`
              : talukName || districtName || "Tamil Nadu";

          return {
            id: biz.id,
            name: biz.name,
            categoryName: biz.category?.name ? biz.category.name.toUpperCase() : "FEATURED",
            locationName,
            imageUrl: finalBgUrl,
            logoUrl: finalLogoUrl,
            slug: biz.slug,
          };
        })
      : DEFAULT_HERO_CARDS;

  return (
    <section className="bg-white text-slate-800 pt-8 pb-12 sm:pt-12 sm:pb-16 lg:pt-16 lg:pb-20 px-4 sm:px-6 lg:px-8 border-b border-slate-100">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
        {/* LEFT COLUMN */}
        <div className={heroCards.length > 0 ? "lg:col-span-7 space-y-6 sm:space-y-7" : "lg:col-span-12 space-y-6 sm:space-y-7 max-w-3xl mx-auto"}>
          {/* 1. Small pill badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EAF7EC] text-[#1A8A2E] border border-[#1A8A2E]/20 text-[11px] sm:text-xs font-extrabold tracking-wide uppercase shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-[#1A8A2E] stroke-[2.5]" />
            <span>TAMIL NADU LOCAL BUSINESS DIRECTORY</span>
          </div>

          {/* 2. Large bold heading */}
          <h1 className="text-4xl sm:5xl lg:text-[56px] lg:leading-[1.12] font-extrabold text-[#000B4D] tracking-tight">
            Find Trusted Businesses <br className="hidden sm:inline" />
            in <span className="text-[#1A8A2E]">Tamil Nadu</span>
          </h1>

          {/* 3. Subheading */}
          <p className="text-base sm:text-lg text-[#4B5563] font-normal leading-relaxed max-w-xl">
            Discover local businesses, services and professionals across Tamil Nadu.
          </p>

          {/* 4. Search bar */}
          <div ref={searchContainerRef} className="relative max-w-2xl">
            <form
              onSubmit={handleSearch}
              className="bg-white p-2.5 sm:p-2 rounded-2xl sm:rounded-full shadow-lg shadow-slate-200/60 border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
            >
              {/* Input 1: Search keyword */}
              <div className="relative flex-1 flex items-center min-w-0">
                <Search className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none shrink-0" />
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => {
                    setKeyword(e.target.value);
                    setIsOpen(true);
                  }}
                  onFocus={() => {
                    if (keyword.trim().length >= 2) setIsOpen(true);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Search businesses, services or categories..."
                  className="w-full pl-11 pr-4 py-3 sm:py-3.5 bg-transparent text-slate-900 placeholder-slate-400 text-xs sm:text-sm font-medium focus:outline-none"
                />
              </div>

              {/* Input 2: Custom Location Dropdown */}
              <div ref={locationContainerRef} className="relative flex items-center border-t sm:border-t-0 sm:border-l border-slate-200 pt-2 sm:pt-0 sm:pl-2 shrink-0 sm:w-44 lg:w-48">
                <button
                  type="button"
                  onClick={() => setLocationDropdownOpen(!locationDropdownOpen)}
                  className="w-full flex items-center justify-between pl-9 sm:pl-10 pr-3 py-2.5 sm:py-3.5 bg-transparent text-slate-800 text-xs sm:text-sm font-semibold focus:outline-none cursor-pointer group"
                >
                  <MapPin className="w-4 h-4 text-[#1A8A2E] absolute left-3 sm:left-4 pointer-events-none shrink-0" />
                  <span className="truncate text-left text-brand-navy font-bold">{displayLocationName}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                      locationDropdownOpen ? "rotate-180 text-brand-green" : "group-hover:text-slate-600"
                    }`}
                  />
                </button>

                {/* Custom Location Dropdown Menu */}
                {locationDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-64 overflow-y-auto py-2 space-y-0.5 animate-in fade-in slide-in-from-top-2 duration-150">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedLocation("");
                        setLocationDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-xs font-semibold flex items-center justify-between transition-colors ${
                        selectedLocation === ""
                          ? "bg-[#EAF7EC] text-[#1A8A2E] font-extrabold"
                          : "text-slate-700 hover:bg-slate-50 hover:text-brand-navy"
                      }`}
                    >
                      <span>All Tamil Nadu</span>
                      {selectedLocation === "" && <Check className="w-3.5 h-3.5 text-[#1A8A2E]" />}
                    </button>

                    <div className="border-t border-slate-100 my-1" />

                    {locations.map((loc) => {
                      const isSelected = selectedLocation === loc.slug;
                      return (
                        <button
                          key={loc.id}
                          type="button"
                          onClick={() => {
                            setSelectedLocation(loc.slug);
                            setLocationDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-xs font-semibold flex items-center justify-between transition-colors ${
                            isSelected
                              ? "bg-[#EAF7EC] text-[#1A8A2E] font-extrabold"
                              : "text-slate-700 hover:bg-slate-50 hover:text-brand-navy"
                          }`}
                        >
                          <span className="truncate">{loc.name}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-[#1A8A2E] shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Search Button */}
              <button
                type="submit"
                className="w-full sm:w-auto px-7 py-3 sm:py-3.5 bg-[#1A8A2E] hover:bg-[#147024] active:scale-[0.99] text-white font-bold text-xs sm:text-sm rounded-xl sm:rounded-full transition-all shadow-sm flex items-center justify-center gap-2 shrink-0 cursor-pointer"
              >
                <Search className="w-4 h-4 stroke-[2.5]" />
                <span>Search</span>
              </button>
            </form>

            {/* Live Autocomplete Dropdown */}
            <SearchAutocompleteDropdown
              query={keyword}
              suggestions={suggestions}
              isLoading={isLoading}
              isOpen={isOpen}
              onClose={() => setIsOpen(false)}
            />
          </div>

          {/* 5. Quick Filters */}
          {activeChips && activeChips.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap pt-1 text-xs text-[#4B5563]">
              <span className="font-semibold text-slate-500 text-xs sm:text-sm mr-1">Quick Filters:</span>
              {activeChips.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    router.push(`/search?category=${encodeURIComponent(chip.categorySlug)}&location=${encodeURIComponent(chip.districtSlug)}`);
                  }}
                  className="px-4 py-1.5 rounded-full bg-white border border-slate-200/90 text-slate-700 font-medium text-xs hover:border-[#1A8A2E] hover:text-[#1A8A2E] hover:bg-[#EAF7EC]/50 transition-all cursor-pointer shadow-2xs"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN - FEATURED SHOWCASE GRID */}
        <div className="lg:col-span-5 mt-4 lg:mt-0">
          {heroCards.length === 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:gap-5">
              <div className="space-y-3 sm:space-y-4 lg:space-y-5">
                <HeroCardSkeleton />
                <HeroCardSkeleton />
              </div>
              <div className="space-y-3 sm:space-y-4 lg:space-y-5 lg:pt-8">
                <HeroCardSkeleton />
                <HeroCardSkeleton />
              </div>
            </div>
          ) : (
            <>
              {heroCards.length === 1 && (
                <div className="max-w-sm mx-auto lg:mx-0">
                  <CardItem card={heroCards[0]} router={router} heightClass="h-56 sm:h-64 lg:h-72" />
                </div>
              )}

              {heroCards.length === 2 && (
                <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:gap-5">
                  <CardItem card={heroCards[0]} router={router} heightClass="h-48 sm:h-56 lg:h-64" />
                  <CardItem card={heroCards[1]} router={router} heightClass="h-48 sm:h-56 lg:h-64" />
                </div>
              )}

              {heroCards.length === 3 && (
                <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:gap-5">
                  <div className="space-y-3 sm:space-y-4 lg:space-y-5">
                    <CardItem card={heroCards[0]} router={router} heightClass="h-44 sm:h-52 lg:h-60" />
                    <CardItem card={heroCards[2]} router={router} heightClass="h-44 sm:h-52 lg:h-60" />
                  </div>
                  <div className="space-y-3 sm:space-y-4 lg:space-y-5 lg:pt-8">
                    <CardItem card={heroCards[1]} router={router} heightClass="h-44 sm:h-52 lg:h-60" />
                  </div>
                </div>
              )}

              {heroCards.length >= 4 && (
                <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:gap-5">
                  {/* Column 1 of Grid (Cards 1 & 3) */}
                  <div className="space-y-3 sm:space-y-4 lg:space-y-5">
                    {[heroCards[0], heroCards[2]].filter(Boolean).map((card) => (
                      <CardItem key={card.id} card={card} router={router} heightClass="h-44 sm:h-52 lg:h-60" />
                    ))}
                  </div>

                  {/* Column 2 of Grid (Cards 2 & 4) with vertical offset on desktop */}
                  <div className="space-y-3 sm:space-y-4 lg:space-y-5 lg:pt-8">
                    {[heroCards[1], heroCards[3]].filter(Boolean).map((card) => (
                      <CardItem key={card.id} card={card} router={router} heightClass="h-44 sm:h-52 lg:h-60" />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function CardItem({
  card,
  router,
  heightClass = "h-44 sm:h-52 lg:h-60",
}: {
  card: CardData;
  router: any;
  heightClass?: string;
}) {
  const handleClick = () => {
    if (card.slug) {
      router.push(`/business/${card.slug}`);
    } else if (card.query) {
      router.push(`/search?q=${encodeURIComponent(card.query)}`);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`group relative rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 ${heightClass} border border-slate-200/80 cursor-pointer bg-slate-900`}
    >
      {/* High-res showcase background photo */}
      <img
        src={card.imageUrl}
        alt={card.name}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      />

      {/* Floating crisp logo badge overlay (if business has logo photo) */}
      {card.logoUrl && (
        <div className="absolute top-3 left-3 z-10 w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/95 backdrop-blur-md p-1 shadow-md border border-white/60 flex items-center justify-center overflow-hidden transition-transform group-hover:scale-105">
          <img
            src={card.logoUrl}
            alt={`${card.name} logo`}
            className="w-full h-full object-contain"
          />
        </div>
      )}

      {/* Natural bottom gradient fade for crisp readability without darkening the hero image */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 via-45% to-transparent flex flex-col justify-end p-3.5 sm:p-4 text-white">
        <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-emerald-400 mb-0.5 sm:mb-1 drop-shadow-sm">
          {card.categoryName}
        </span>
        <h3 className="font-extrabold text-white text-xs sm:text-base leading-tight drop-shadow-sm line-clamp-1 group-hover:text-emerald-200 transition-colors">
          {card.name}
        </h3>
        <p className="text-[10px] sm:text-xs text-slate-200 font-medium mt-0.5 drop-shadow-sm line-clamp-1">
          {card.locationName}
        </p>
      </div>
    </div>
  );
}
