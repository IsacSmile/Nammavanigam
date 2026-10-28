"use client";

import { useState, useEffect, useLayoutEffect, useRef, useId } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Building2,
  FolderTree,
  MapPin,
  ShieldCheck,
  Star,
  Phone,
  MessageSquare,
  Globe,
  Navigation,
  FileText,
  Clock,
  ImageIcon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  Share2,
  Check,
  Mail,
  ExternalLink,
  ArrowRight,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Flag,
  Send,
  Maximize2,
  LogIn,
} from "lucide-react";
import Header from "@/components/Header";
import { SocialIcon } from "@/components/SocialIcon";
import { telHref, normalizeSocialUrl, PLATFORM_META, SocialPlatform } from "@/lib/contact";

export interface BusinessPhoto {
  id: number;
  imageUrl: string;
  altText: string | null;
  sortOrder: number;
}

export interface BusinessService {
  id: number;
  serviceName: string;
  description: string | null;
  price: any;
  imageUrl?: string | null;
}

export interface BusinessHour {
  id: number;
  day: string;
  openingTime: string | null;
  closingTime: string | null;
  closed: boolean;
}

export interface RelatedBusiness {
  id: number;
  name: string;
  slug: string;
  category: { name: string; slug: string };
  location: { name: string; slug: string; parent?: { name: string; slug: string } | null };
  businessPhotos: { imageUrl: string; altText: string | null }[];
  verified: boolean;
  featured: boolean;
}

export interface ReviewData {
  id: number;
  rating: number;
  comment: string | null;
  createdAt: Date | string;
  user?: {
    id: number;
    name: string;
  };
}

export interface BusinessProfileData {
  id: number;
  name: string;
  slug: string;
  status: string;
  description: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  verified: boolean;
  featured: boolean;
  createdAt: Date | string;
  updatedAt?: Date | string;
  bannerUrl?: string | null;
  category: { id: number; name: string; slug: string };
  location: { id: number; name: string; slug: string; parent?: { id?: number; name: string; slug: string } | null };
  owner: { id: number; name: string; email: string; phone: string | null };
  businessPhotos: BusinessPhoto[];
  businessServices: BusinessService[];
  businessHours: BusinessHour[];
  businessPhones?: { number: string; label?: string | null }[];
  businessSocialLinks?: { platform: string; url: string }[];
  reviews?: ReviewData[];
}

interface BusinessProfileClientProps {
  business: BusinessProfileData;
  relatedBusinesses: RelatedBusiness[];
}

// Smart 3-line address formatter:
// Line 1: Street / Building
// Line 2: Locality / Area
// Line 3: City + Pincode
function parseAddressLines(
  address: string | null | undefined,
  locationName: string | null | undefined,
  districtName?: string | null | undefined
): { line1: string; line2: string; line3: string } {
  const fallbackLocality = locationName || districtName || "Tamil Nadu";
  const fallbackCity = districtName
    ? `${districtName}, Tamil Nadu`
    : locationName && locationName !== "Tamil Nadu"
    ? `${locationName}, Tamil Nadu`
    : "Tamil Nadu, India";

  if (!address || !address.trim()) {
    return {
      line1: fallbackLocality,
      line2: districtName || "Tamil Nadu",
      line3: "Tamil Nadu, India",
    };
  }

  const raw = address.trim();

  // If newlines exist in input, prioritize explicit multi-line division
  if (raw.includes("\n")) {
    const rawLines = raw.split("\n").map((s) => s.trim()).filter(Boolean);
    if (rawLines.length >= 3) {
      return {
        line1: rawLines[0],
        line2: rawLines[1],
        line3: rawLines.slice(2).join(", "),
      };
    } else if (rawLines.length === 2) {
      return {
        line1: rawLines[0],
        line2: rawLines[1],
        line3: fallbackCity,
      };
    } else if (rawLines.length === 1) {
      return {
        line1: rawLines[0],
        line2: fallbackLocality,
        line3: fallbackCity,
      };
    }
  }

  // Comma-separated parsing
  const parts = raw.split(",").map((s) => s.trim()).filter(Boolean);

  if (parts.length === 1) {
    return {
      line1: parts[0],
      line2: fallbackLocality,
      line3: fallbackCity,
    };
  }

  if (parts.length === 2) {
    return {
      line1: parts[0],
      line2: parts[1] || fallbackLocality,
      line3: fallbackCity,
    };
  }

  if (parts.length === 3) {
    return {
      line1: parts[0],
      line2: parts[1],
      line3: parts[2],
    };
  }

  if (parts.length === 4) {
    return {
      line1: parts[0],
      line2: parts[1],
      line3: `${parts[2]}, ${parts[3]}`,
    };
  }

  // 5 or more parts: e.g. ["Phase 1", "Anna Salai", "Guindy", "Chennai", "Tamil Nadu 600032"]
  const line3 = `${parts[parts.length - 2]}, ${parts[parts.length - 1]}`;
  const line2 = parts[parts.length - 3];
  const line1 = parts.slice(0, parts.length - 3).join(", ");

  return { line1, line2, line3 };
}

function WhatsAppIcon({ className = "w-4 h-4 fill-current shrink-0" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.572-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c-.001 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

function ServiceCard({ service }: { service: BusinessService }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);
  const descRef = useRef<HTMLParagraphElement>(null);
  const isExpandedRef = useRef(isExpanded);
  isExpandedRef.current = isExpanded;
  const descriptionId = useId();

  useIsomorphicLayoutEffect(() => {
    const el = descRef.current;
    if (!el || !service.description) return;

    const checkTruncation = () => {
      if (!isExpandedRef.current && el) {
        setIsTruncated(el.scrollHeight > el.clientHeight);
      }
    };

    checkTruncation();

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
        checkTruncation();
      });
      resizeObserver.observe(el);
    }

    window.addEventListener("resize", checkTruncation);

    if (typeof document !== "undefined" && "fonts" in document) {
      document.fonts.ready.then(() => {
        checkTruncation();
      });
    }

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      window.removeEventListener("resize", checkTruncation);
    };
  }, [isExpanded, service.description]);

  const imageUrl = service.imageUrl
    ? service.imageUrl.includes("/upload/")
      ? service.imageUrl.replace("/upload/", "/upload/f_auto,q_auto,c_fill,g_auto,w_240,h_240/")
      : service.imageUrl
    : null;

  const showButton = Boolean(service.description && (isExpanded || isTruncated));

  return (
    <div className="p-3 sm:p-3.5 rounded-xl bg-slate-50/70 hover:bg-slate-50 border border-slate-200/70 hover:border-slate-300 transition-all flex items-start gap-3 sm:gap-3.5 group">
      {imageUrl && (
        <img
          src={imageUrl}
          alt={service.serviceName}
          width={112}
          height={112}
          loading="lazy"
          className="w-[88px] h-[88px] md:w-[112px] md:h-[112px] rounded-xl object-cover shrink-0 border border-slate-200/60"
        />
      )}

      <div className="flex-1 min-w-0 flex flex-col justify-between space-y-1">
        <div className="space-y-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-[#000B4D] text-xs sm:text-sm leading-snug group-hover:text-[#1A8A2E] transition-colors break-words">
              {service.serviceName}
            </h3>
            {service.price && (
              <span className="font-mono font-medium text-xs text-[#1A8A2E] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60 tabular-nums shrink-0">
                ₹{String(service.price)}
              </span>
            )}
          </div>
          {service.description && (
            <p
              id={descriptionId}
              ref={descRef}
              className={`text-xs text-slate-600 leading-relaxed font-normal whitespace-pre-line break-words ${
                isExpanded ? "" : "line-clamp-3"
              }`}
            >
              {service.description}
            </p>
          )}
          {showButton && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded((prev) => !prev);
              }}
              aria-expanded={isExpanded}
              aria-controls={descriptionId}
              className="text-left text-[#1A8A2E] font-semibold text-sm hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1A8A2E] rounded py-3 -my-3"
            >
              {isExpanded ? "Show less" : "Read more"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BusinessProfileClient({
  business,
  relatedBusinesses,
}: BusinessProfileClientProps) {
  // Lightbox State
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Share Notification state
  const [copied, setCopied] = useState(false);

  // Review List & Submission State
  const { data: session, status: authStatus } = useSession();
  const [reviewsList, setReviewsList] = useState<ReviewData[]>(business.reviews || []);
  const [visibleReviewsCount, setVisibleReviewsCount] = useState<number>(5);

  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [userHasReviewed, setUserHasReviewed] = useState(false);
  const [checkingReviewStatus, setCheckingReviewStatus] = useState(true);

  // Review Reporting Modal State
  const [reportingReview, setReportingReview] = useState<ReviewData | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [reportSuccess, setReportSuccess] = useState<string | null>(null);
  const [reportedReviewIds, setReportedReviewIds] = useState<number[]>([]);

  // Call Menu Dropdown State
  const [isCallMenuOpen, setIsCallMenuOpen] = useState(false);
  const callMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isCallMenuOpen) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (callMenuRef.current && !callMenuRef.current.contains(e.target as Node)) {
        setIsCallMenuOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsCallMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isCallMenuOpen]);

  // Consolidate all phone numbers: primary first, followed by additional
  const allPhones: Array<{ number: string; label?: string | null; isPrimary: boolean }> = [];
  if (business.phone && business.phone.trim()) {
    allPhones.push({
      number: business.phone.trim(),
      label: null,
      isPrimary: true,
    });
  }
  if (Array.isArray(business.businessPhones)) {
    for (const p of business.businessPhones) {
      if (p.number && p.number.trim()) {
        allPhones.push({
          number: p.number.trim(),
          label: p.label || null,
          isPrimary: false,
        });
      }
    }
  }

  // Validate social media links at render time
  const validatedSocialLinks = (business.businessSocialLinks || [])
    .map((s) => {
      const res = normalizeSocialUrl(s.platform, s.url);
      if (res.success && res.url) {
        const p = s.platform.toLowerCase() as SocialPlatform;
        return {
          platform: p,
          url: res.url,
          label: PLATFORM_META[p]?.label || s.platform,
        };
      }
      return null;
    })
    .filter((s): s is { platform: SocialPlatform; url: string; label: string } => s !== null);

  // Front-end WhatsApp Enquiry Form State
  const [enquiryName, setEnquiryName] = useState("");
  const [enquiryPhone, setEnquiryPhone] = useState("");
  const [enquiryMessage, setEnquiryMessage] = useState("");
  const [enquiryErrors, setEnquiryErrors] = useState<{ name?: string; message?: string }>({});
  const [enquirySent, setEnquirySent] = useState(false);

  const handleOpenReportModal = (review: ReviewData) => {
    setReportingReview(review);
    setReportReason("");
    setReportError(null);
    setReportSuccess(null);
  };

  const handleCloseReportModal = () => {
    setReportingReview(null);
    setReportReason("");
    setReportError(null);
    setReportSuccess(null);
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportingReview) return;

    setIsSubmittingReport(true);
    setReportError(null);
    setReportSuccess(null);

    try {
      const res = await fetch(`/api/reviews/${reportingReview.id}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reportReason }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409 || (data.error && data.error.toLowerCase().includes("already reported"))) {
          setReportedReviewIds((prev) => Array.from(new Set([...prev, reportingReview.id])));
        }
        throw new Error(data.error || "Failed to submit report.");
      }

      setReportedReviewIds((prev) => Array.from(new Set([...prev, reportingReview.id])));
      setReportSuccess("Report submitted successfully. Thank you!");
      setTimeout(() => {
        handleCloseReportModal();
      }, 1800);
    } catch (err: any) {
      setReportError(err.message || "Failed to submit report.");
    } finally {
      setIsSubmittingReport(false);
    }
  };

  // Sync state if business prop updates
  useEffect(() => {
    if (Array.isArray(business.reviews)) {
      setReviewsList(business.reviews);
    }
  }, [business.reviews]);

  // Derived Header Ratings
  const reviewsCount = reviewsList.length;
  const avgRating =
    reviewsCount > 0
      ? (reviewsList.reduce((acc: number, r: any) => acc + Number(r.rating), 0) / reviewsCount).toFixed(1)
      : null;

  // Check if current user has already reviewed this business
  useEffect(() => {
    if (authStatus === "authenticated" && business.id) {
      setCheckingReviewStatus(true);
      fetch(`/api/businesses/${business.id}/reviews`)
        .then((res) => (res.ok ? res.json() : { userHasReviewed: false }))
        .then((data) => {
          if (data.userHasReviewed) {
            setUserHasReviewed(true);
          }
          if (data.reportedReviewIds && Array.isArray(data.reportedReviewIds)) {
            setReportedReviewIds(data.reportedReviewIds);
          }
        })
        .catch(() => {})
        .finally(() => setCheckingReviewStatus(false));
    } else if (authStatus === "unauthenticated") {
      setCheckingReviewStatus(false);
    }
  }, [authStatus, business.id]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1 || rating > 5) {
      setReviewError("Please select a rating between 1 and 5 stars.");
      return;
    }

    setIsSubmittingReview(true);
    setReviewError(null);
    setReviewSuccess(null);

    try {
      const res = await fetch(`/api/businesses/${business.id}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to submit review.");
      }

      setReviewSuccess("Thank you! Your review has been saved successfully.");
      setUserHasReviewed(true);

      const newRevRecord: ReviewData = {
        id: data.reviewId || Date.now(),
        rating,
        comment: comment ? comment.trim() : null,
        createdAt: new Date().toISOString(),
        user: {
          id: Number(session?.user?.id || 0),
          name: session?.user?.name || "Community Member",
        },
      };
      setReviewsList([newRevRecord, ...reviewsList]);
    } catch (err: any) {
      setReviewError(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Determine current day of week (e.g. "Monday", "Tuesday"...)
  const [currentDayName, setCurrentDayName] = useState<string>("");

  useEffect(() => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const today = days[new Date().getDay()];
    setCurrentDayName(today);
  }, []);

  // WhatsApp Link formatting
  const rawWa = business.whatsapp || business.phone || "";
  const cleanWa = rawWa.replace(/\D/g, "");
  const formattedWa = cleanWa.length === 10 ? `91${cleanWa}` : cleanWa;
  const whatsappUrl = formattedWa
    ? `https://wa.me/${formattedWa}?text=${encodeURIComponent(
        `Hi ${business.name}, I found your listing on Namma Vanigam`
      )}`
    : null;

  // Google Maps Directions link & Embed query
  const talukDistrictStr = Array.from(
    new Set([business.location?.name, business.location?.parent?.name, "Tamil Nadu"].filter(Boolean))
  ).join(", ");

  const directionsUrl =
    business.latitude && business.longitude
      ? `https://www.google.com/maps/search/?api=1&query=${business.latitude},${business.longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          business.address
            ? `${business.address}, ${talukDistrictStr}`
            : `${business.name}, ${talukDistrictStr}`
        )}`;

  // Google Maps Embedded iframe location query
  const mapEmbedQuery =
    business.latitude && business.longitude
      ? `${business.latitude},${business.longitude}`
      : business.address
      ? `${business.address}, ${talukDistrictStr}`
      : `${business.name}, ${talukDistrictStr}`;

  // Cover photo (1st photo from existing sort order)
  const coverPhoto = business.businessPhotos?.[0]?.imageUrl || null;

  // Cloudinary optimization for banner (f_auto,q_auto,c_limit,w_1600)
  const getOptimizedBannerUrl = (url: string | null | undefined): string | null => {
    if (!url) return null;
    if (url.includes("/upload/")) {
      return url.replace("/upload/", "/upload/f_auto,q_auto,c_limit,w_1600/");
    }
    return url;
  };

  // Hero image source order: banner_url if set, else first photo, else brand gradient
  const heroImage = business.bannerUrl
    ? getOptimizedBannerUrl(business.bannerUrl)
    : (coverPhoto || null);

  // 3-line parsed address
  const addressLines = parseAddressLines(
    business.address,
    business.location?.name,
    business.location?.parent?.name
  );

  // Lightbox handlers
  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);
  const prevLightbox = () => {
    if (lightboxIndex === null || !business.businessPhotos.length) return;
    setLightboxIndex((prev) => (prev! === 0 ? business.businessPhotos.length - 1 : prev! - 1));
  };
  const nextLightbox = () => {
    if (lightboxIndex === null || !business.businessPhotos.length) return;
    setLightboxIndex((prev) => (prev! === business.businessPhotos.length - 1 ? 0 : prev! + 1));
  };

  // Keyboard navigation for Lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") prevLightbox();
      if (e.key === "ArrowRight") nextLightbox();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightboxIndex]);

  // Share Profile link
  const handleShare = async () => {
    const shareUrl = typeof window !== "undefined" ? window.location.href : "";
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${business.name} - Namma Vanigam`,
          text: `Check out ${business.name} in ${business.location?.name || "Tamil Nadu"} on Namma Vanigam`,
          url: shareUrl,
        });
      } catch (err) {
        copyToClipboard(shareUrl);
      }
    } else {
      copyToClipboard(shareUrl);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  // Today's Operating Hour Status
  const todayHour = business.businessHours?.find(
    (h) => h.day.toLowerCase() === currentDayName.toLowerCase()
  );

  // Front-end WhatsApp Enquiry Form Handler
  const handleEnquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { name?: string; message?: string } = {};

    if (!enquiryName.trim()) {
      errors.name = "Please enter your name";
    }
    if (!enquiryMessage.trim()) {
      errors.message = "Please write a brief message or question";
    }

    if (Object.keys(errors).length > 0) {
      setEnquiryErrors(errors);
      return;
    }

    setEnquiryErrors({});

    const phonePart = enquiryPhone.trim() ? `, ${enquiryPhone.trim()}` : "";
    const waText = `Hi ${business.name}, I'm ${enquiryName.trim()}${phonePart}. ${enquiryMessage.trim()} (Sent via Namma Vanigam)`;

    if (formattedWa) {
      window.open(`https://wa.me/${formattedWa}?text=${encodeURIComponent(waText)}`, "_blank");
      setEnquirySent(true);
      setTimeout(() => setEnquirySent(false), 5000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-800 font-sans antialiased tracking-[-0.01em] overflow-x-hidden">
      {/* Existing Site Header */}
      <Header />

      {/* Main Centered Page Container (max-width 1040px, compact modern layout) */}
      <main className="max-w-[1040px] mx-auto w-full px-4 sm:px-6 pt-0 md:pt-5 pb-10 sm:pb-14 space-y-4 sm:space-y-6">
        {/* ========================================================= */}
        {/* SECTION 1: HERO (Mobile: full-bleed 16:9 banner, overlap) */}
        {/* ========================================================= */}
        <section
          id="hero"
          className="bg-white -mx-4 sm:-mx-6 md:mx-0 md:rounded-2xl md:border md:border-slate-200/80 md:shadow-xs overflow-visible"
        >
          {/* Banner: Full-bleed edge to edge, aspect 16/9 mobile, h-72 md:h-80 desktop, no side rounding on mobile */}
          <div className="relative aspect-[16/9] md:aspect-auto md:h-72 lg:h-80 w-full overflow-hidden bg-slate-100 md:rounded-t-2xl">
            {heroImage ? (
              <img
                src={heroImage}
                alt=""
                loading="eager"
                fetchPriority="high"
                className="w-full h-full object-cover object-center"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-[#000B4D] to-[#1A8A2E]" />
            )}

            {/* Light bottom gradient (max ~25% black) */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent pointer-events-none" />

            {/* Badges Top-Right: Compact on mobile (px-2.5 py-0.5, 12px text, 13px icons) */}
            <div className="absolute top-3 right-3 sm:top-4 sm:right-4 flex items-center gap-1.5 sm:gap-2 z-10 flex-wrap justify-end">
              {business.featured && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500 text-white font-medium text-xs shadow-xs border border-amber-300/40">
                  <Star className="w-3 h-3 fill-white" />
                  <span className="sm:hidden">Featured</span>
                  <span className="hidden sm:inline">Featured Business</span>
                </span>
              )}
              {business.verified && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#1A8A2E] text-white font-medium text-xs shadow-xs border border-emerald-300/40">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Verified</span>
                </span>
              )}
            </div>
          </div>

          {/* Everything sits fully BELOW the banner on white with 16px side gutter on mobile */}
          <div className="px-4 sm:px-6 md:px-7 pb-4 sm:pb-6 pt-0 relative bg-white md:rounded-b-2xl overflow-visible">
            <div className="flex flex-col md:flex-row md:items-start md:gap-6">
              {/* Avatar row on mobile (avatar left, 44px circle share button right) / Avatar only on desktop */}
              <div className="flex items-end justify-between -mt-[32px] md:-mt-[44px] mb-2 md:mb-0 shrink-0 relative z-20">
                {/* Logo Avatar: 80px mobile (overlap ~40%), 112px desktop, rounded frame fully visible on all sides */}
                <div className="w-20 h-20 md:w-28 md:h-28 rounded-2xl bg-white p-1.5 shadow-md border-3 border-white shrink-0 relative z-30 overflow-hidden">
                  {coverPhoto ? (
                    <img
                      src={coverPhoto}
                      alt={business.name}
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    <div className="w-full h-full rounded-xl bg-[#EBF7ED] text-[#1A8A2E] flex items-center justify-center font-bold text-xl md:text-2xl">
                      <Building2 className="w-8 h-8 md:w-12 md:h-12 text-[#1A8A2E]" />
                    </div>
                  )}
                </div>

                {/* Mobile: 44px circle icon-only Share button, aligned to bottom of avatar row */}
                <button
                  type="button"
                  onClick={handleShare}
                  aria-label="Share profile"
                  className="md:hidden w-11 h-11 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center border border-slate-200 shadow-2xs cursor-pointer active:scale-95 transition-all shrink-0 min-h-[44px] min-w-[44px]"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-[#1A8A2E]" />
                  ) : (
                    <Share2 className="w-4 h-4 text-slate-600" />
                  )}
                </button>
              </div>

              {/* Text content: below avatar on mobile, to the right of avatar on desktop */}
              <div className="flex-1 w-full space-y-2 md:pt-2">
                {/* Category & Locality Chips */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#EBF7ED] text-[#1A8A2E] font-medium text-xs border border-[#1A8A2E]/20">
                    <FolderTree className="w-3 h-3" />
                    {business.category?.name || "Category"}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#EBF4FA] text-[#0463A5] font-medium text-xs border border-[#0463A5]/20">
                    <MapPin className="w-3 h-3" />
                    {business.location?.parent?.name
                      ? `${business.location.name}, ${business.location.parent.name}`
                      : business.location?.name || "Tamil Nadu"}
                  </span>
                </div>

                {/* Business Name (h1 in navy #000B4D, small and clean font) + Desktop Share button */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-2.5">
                  <h1 className="text-lg sm:text-xl md:text-2xl font-semibold text-[#000B4D] tracking-tight leading-snug [overflow-wrap:anywhere] flex-1">
                    {business.name}
                  </h1>

                  {/* Share button on desktop beside business name */}
                  <button
                    type="button"
                    onClick={handleShare}
                    className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs transition-colors border border-slate-200 shadow-2xs cursor-pointer shrink-0 min-h-[44px]"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-[#1A8A2E]" />
                    ) : (
                      <Share2 className="w-4 h-4 text-slate-600" />
                    )}
                    <span>{copied ? "Link Copied!" : "Share Profile"}</span>
                  </button>
                </div>

                {/* Tagline: CSS line-clamp-2 */}
                {business.description && (
                  <p className="text-xs sm:text-[13px] text-slate-600 font-normal leading-relaxed line-clamp-2 max-w-2xl [overflow-wrap:anywhere]">
                    {business.description}
                  </p>
                )}

                {/* Status Row: Rating Badge & Today Hours together in one flex-wrap row */}
                <div className="flex items-center gap-2 pt-0.5 flex-wrap">
                  {reviewsCount > 0 ? (
                    <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200/90 font-medium text-xs shadow-2xs">
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
                      <span>{avgRating} ★</span>
                      <span className="text-amber-800/80 font-normal">
                        ({reviewsCount})
                      </span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200 text-xs font-medium">
                      <Star className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>No reviews yet</span>
                    </div>
                  )}

                  {todayHour && (
                    <div className="flex items-center gap-1.5 text-xs font-medium">
                      {todayHour.closed ? (
                        <span className="text-rose-600 font-medium flex items-center gap-1 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                          <Clock className="w-3 h-3 text-rose-500" />
                          Closed Today ({currentDayName})
                        </span>
                      ) : (
                        <span className="text-emerald-800 font-medium flex items-center gap-1 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Open Today ({todayHour.openingTime} - {todayHour.closingTime})
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION 2: CONTACT DETAILS (Prominent CTAs below hero)    */}
        {/* ========================================================= */}
        <section className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2 border-b border-slate-100 pb-2.5">
            <h2 className="text-sm sm:text-base font-semibold text-[#000B4D] flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-[#1A8A2E]" />
              Get in touch with us
            </h2>
            <p className="text-xs text-slate-500 font-normal">
              Call directly or chat via WhatsApp
            </p>
          </div>

          {/* Primary CTAs: Call & WhatsApp */}
          <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
            {allPhones.length === 0 ? (
              <button
                disabled
                className="w-full flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-2.5 bg-slate-100 text-slate-400 font-medium text-xs sm:text-sm rounded-xl cursor-not-allowed min-h-[44px]"
              >
                <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span className="truncate">No Phone Listed</span>
              </button>
            ) : allPhones.length === 1 ? (
              <a
                href={telHref(allPhones[0].number)}
                className="w-full flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-2.5 bg-[#1A8A2E] hover:bg-[#147024] text-white font-medium text-xs sm:text-sm rounded-xl shadow-2xs transition-all min-h-[44px]"
              >
                <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span className="truncate">Call {allPhones[0].number}</span>
              </a>
            ) : (
              <div className="relative w-full" ref={callMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsCallMenuOpen((prev) => !prev)}
                  aria-haspopup="menu"
                  aria-expanded={isCallMenuOpen}
                  className="w-full flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-2.5 bg-[#1A8A2E] hover:bg-[#147024] text-white font-medium text-xs sm:text-sm rounded-xl shadow-2xs transition-all min-h-[44px] cursor-pointer"
                >
                  <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  <span>Call</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-200 ${
                      isCallMenuOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isCallMenuOpen && (
                  <div
                    role="menu"
                    className="absolute z-30 top-full left-0 right-0 sm:right-auto sm:w-72 mt-2 bg-white rounded-xl shadow-xl border border-slate-200 py-1 overflow-hidden"
                  >
                    {allPhones.map((p, idx) => (
                      <a
                        key={idx}
                        role="menuitem"
                        href={telHref(p.number)}
                        onClick={() => setIsCallMenuOpen(false)}
                        className="min-h-[44px] px-3.5 py-2.5 flex items-center justify-between gap-2 hover:bg-emerald-50 text-slate-800 hover:text-emerald-900 border-b border-slate-100 last:border-b-0 transition-colors"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="font-semibold text-xs sm:text-sm truncate">
                            {p.number}
                          </span>
                        </div>
                        {p.label && (
                          <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded shrink-0">
                            {p.label}
                          </span>
                        )}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}

            {whatsappUrl ? (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-2.5 bg-[#25D366] hover:bg-[#20bd5a] text-white font-medium text-xs sm:text-sm rounded-xl shadow-2xs transition-all min-h-[44px]"
              >
                <WhatsAppIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-white shrink-0" />
                <span className="truncate">Chat on WhatsApp</span>
              </a>
            ) : (
              <button
                disabled
                className="w-full flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-2.5 bg-slate-100 text-slate-400 font-medium text-xs sm:text-sm rounded-xl cursor-not-allowed min-h-[44px]"
              >
                <WhatsAppIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-slate-400 shrink-0" />
                <span className="truncate">No WhatsApp Listed</span>
              </button>
            )}
          </div>

          {/* Secondary Action Buttons: Directions & Website */}
          <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
            <a
              href={directionsUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium text-xs sm:text-sm rounded-xl transition-all border border-slate-200/80 min-h-[44px]"
            >
              <Navigation className="w-3.5 h-3.5 text-[#1A8A2E] shrink-0" />
              <span className="truncate">Get Directions</span>
            </a>

            {business.website ? (
              <a
                href={
                  business.website.startsWith("http")
                    ? business.website
                    : `https://${business.website}`
                }
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-2 bg-slate-50 hover:bg-[#EBF4FA] hover:text-[#0463A5] text-slate-700 font-medium text-xs sm:text-sm rounded-xl transition-all border border-slate-200/80 min-h-[44px]"
              >
                <Globe className="w-3.5 h-3.5 text-[#0463A5] shrink-0" />
                <span className="truncate">Visit Official Website</span>
              </a>
            ) : (
              <button
                disabled
                className="flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-2 bg-slate-50 text-slate-400 font-medium text-xs sm:text-sm rounded-xl border border-slate-200/60 cursor-not-allowed min-h-[44px]"
              >
                <Globe className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                <span className="truncate">No Website</span>
              </button>
            )}
          </div>

          {/* Exactly 3-Line Formatted Address */}
          <div className="flex items-start gap-2.5 p-3 sm:p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/70">
            <div className="p-1.5 rounded-lg bg-white shadow-2xs border border-slate-200 text-[#1A8A2E] shrink-0 mt-0.5">
              <MapPin className="w-3.5 h-3.5" />
            </div>
            <div className="text-xs leading-snug space-y-0.5">
              <div className="font-semibold text-[#000B4D] text-xs sm:text-sm">{addressLines.line1}</div>
              <div className="text-slate-600 font-normal text-xs">{addressLines.line2}</div>
              <div className="text-slate-500 font-normal text-xs">{addressLines.line3}</div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION 3: ABOUT (Full-width band, compact modern)        */}
        {/* ========================================================= */}
        <section id="about" className="bg-white rounded-2xl py-4 px-3.5 sm:py-5 sm:px-6 space-y-2.5 border border-slate-100 shadow-2xs">
          <div className="space-y-0.5">
            <h2 className="text-sm sm:text-base font-semibold text-[#000B4D] flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-[#1A8A2E]" />
              A little about us
            </h2>
            <p className="text-xs text-slate-500 font-normal">
              Background, specialties, and history of {business.name}.
            </p>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal whitespace-pre-line pt-0.5">
            {business.description || "This business has not added an about description yet. Check back soon or reach out via phone or WhatsApp for details."}
          </p>
        </section>

        {/* ========================================================= */}
        {/* SECTION 4: SERVICES & OFFERINGS                           */}
        {/* ========================================================= */}
        {business.businessServices && business.businessServices.length > 0 && (
          <section id="services" className="bg-white rounded-2xl p-3.5 sm:p-5 space-y-3.5 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="space-y-0.5">
                <h2 className="text-sm sm:text-base font-semibold text-[#000B4D] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#1A8A2E]" />
                  What we do
                </h2>
                <p className="text-xs text-slate-500 font-normal">
                  Explore services and products offered by {business.name}.
                </p>
              </div>
              <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full shrink-0">
                {business.businessServices.length} {business.businessServices.length === 1 ? "offering" : "offerings"}
              </span>
            </div>

            <div
              className="grid items-start gap-2.5 sm:gap-3"
              style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))" }}
            >
              {business.businessServices.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          </section>
        )}

        {/* ========================================================= */}
        {/* SECTION 5: GALLERY (Adaptive layout: 1, 2, 3+ photos)     */}
        {/* ========================================================= */}
        {business.businessPhotos && business.businessPhotos.length > 0 && (
          <section id="gallery" className="bg-white rounded-2xl py-4 px-3.5 sm:py-5 sm:px-6 space-y-3.5 border border-slate-100 shadow-2xs">
            <div className="space-y-0.5">
              <h2 className="text-sm sm:text-base font-semibold text-[#000B4D] flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-[#1A8A2E]" />
                Take a look around
              </h2>
              <p className="text-xs text-slate-500 font-normal">
                Photo highlights and venue glimpses ({business.businessPhotos.length} {business.businessPhotos.length === 1 ? "photo" : "photos"}).
              </p>
            </div>

            {/* 1 Photo Layout: One large 16:10 image filling section width */}
            {business.businessPhotos.length === 1 && (
              <div className="pt-0.5">
                <button
                  type="button"
                  onClick={() => openLightbox(0)}
                  className="group relative w-full aspect-[16/10] max-h-[500px] rounded-xl overflow-hidden bg-slate-100 border border-slate-200 text-left focus:outline-none focus:ring-2 focus:ring-[#1A8A2E] cursor-pointer shadow-xs block"
                >
                  <img
                    src={business.businessPhotos[0].imageUrl}
                    alt={business.businessPhotos[0].altText || business.name}
                    className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                  />
                  {/* Desktop hover label */}
                  <div className="hidden md:flex absolute inset-0 bg-[#000B4D]/30 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity items-center justify-center">
                    <span className="px-4 py-2 rounded-full bg-white/95 text-[#000B4D] text-xs sm:text-sm font-semibold shadow-md">
                      View Photo
                    </span>
                  </div>
                  {/* Touch corner expand icon */}
                  <div className="md:hidden absolute bottom-3 right-3 bg-black/60 backdrop-blur-xs text-white p-2 rounded-xl shadow">
                    <Maximize2 className="w-4 h-4" />
                  </div>
                </button>
              </div>
            )}

            {/* 2 Photos Layout: Two equal columns */}
            {business.businessPhotos.length === 2 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-1">
                {business.businessPhotos.map((photo, idx) => (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() => openLightbox(idx)}
                    className="group relative aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 border border-slate-200 text-left focus:outline-none focus:ring-2 focus:ring-[#1A8A2E] cursor-pointer shadow-xs block"
                  >
                    <img
                      src={photo.imageUrl}
                      alt={photo.altText || business.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="hidden md:flex absolute inset-0 bg-[#000B4D]/30 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity items-center justify-center">
                      <span className="px-4 py-2 rounded-full bg-white/95 text-[#000B4D] text-xs sm:text-sm font-semibold shadow-md">
                        View Photo
                      </span>
                    </div>
                    <div className="md:hidden absolute bottom-3 right-3 bg-black/60 backdrop-blur-xs text-white p-2 rounded-xl shadow">
                      <Maximize2 className="w-4 h-4" />
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* 3+ Photos Layout: Responsive grid (2 cols mobile, 3 desktop) */}
            {business.businessPhotos.length >= 3 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 pt-1">
                {business.businessPhotos.map((photo, idx) => (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() => openLightbox(idx)}
                    className="group relative aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 border border-slate-200 text-left focus:outline-none focus:ring-2 focus:ring-[#1A8A2E] cursor-pointer shadow-xs block"
                  >
                    <img
                      src={photo.imageUrl}
                      alt={photo.altText || business.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="hidden md:flex absolute inset-0 bg-[#000B4D]/30 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity items-center justify-center">
                      <span className="px-3.5 py-1.5 rounded-full bg-white/95 text-[#000B4D] text-xs font-semibold shadow-md">
                        View Photo
                      </span>
                    </div>
                    <div className="md:hidden absolute bottom-2 right-2 bg-black/60 backdrop-blur-xs text-white p-1.5 rounded-lg shadow">
                      <Maximize2 className="w-3.5 h-3.5" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ========================================================= */}
        {/* REVIEWS & RATINGS (Placed after Gallery)                  */}
        {/* ========================================================= */}
        <section id="reviews" className="bg-white p-3.5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3.5">
          <div className="border-b border-slate-100 pb-3 space-y-2">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
              <div>
                <h2 className="text-sm sm:text-base font-semibold text-[#000B4D] flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  What people are saying
                </h2>
                <p className="text-xs text-slate-500 mt-0.5 font-normal">
                  Reviews from the Namma Vanigam community.
                </p>
              </div>

              {reviewsCount > 0 ? (
                <div className="p-2 sm:p-2.5 bg-amber-50/70 border border-amber-200/80 rounded-xl flex items-center gap-2 shrink-0">
                  <div className="text-xl font-bold text-amber-900 tracking-tight flex items-center gap-1">
                    <span>{avgRating}</span>
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  </div>
                  <div className="text-[11px] sm:text-xs text-amber-800 font-medium border-l border-amber-200/80 pl-2">
                    <div>Overall Rating</div>
                    <div className="text-[11px] text-amber-700 font-normal">
                      based on {reviewsCount} {reviewsCount === 1 ? "review" : "reviews"}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="px-2.5 py-1 bg-slate-100 rounded-lg text-xs font-medium text-slate-500 border border-slate-200">
                  No reviews yet
                </div>
              )}
            </div>
          </div>

          {/* Review Submission Form Container */}
          <div id="review-form-card" className="p-3.5 sm:p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-2.5">
            <h3 className="text-xs sm:text-sm font-semibold text-[#000B4D]">
              Leave a Review
            </h3>

            {authStatus === "loading" || checkingReviewStatus ? (
              <div className="text-xs text-slate-400 py-1.5 font-medium flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
                <span>Checking review status...</span>
              </div>
            ) : authStatus === "unauthenticated" ? (
              <div className="p-3.5 sm:p-4 bg-white border border-slate-200 rounded-xl text-center space-y-2 shadow-2xs">
                <p className="text-xs text-slate-600 font-normal">
                  Log in to share your customer experience with <strong>{business.name}</strong>.
                </p>
                <div>
                  <Link
                    href={`/login?callbackUrl=${encodeURIComponent(`/business/${business.slug}`)}`}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#000B4D] hover:bg-[#001466] active:bg-[#000733] text-white font-medium text-xs sm:text-sm rounded-lg border border-[#000B4D] transition-all shadow-xs min-h-[44px] cursor-pointer"
                  >
                    <LogIn className="w-3.5 h-3.5 text-slate-200 shrink-0" />
                    <span>Log in to leave a review</span>
                  </Link>
                </div>
              </div>
            ) : userHasReviewed ? (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>You&apos;ve already reviewed this business. Thank you for your feedback!</span>
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="space-y-2.5 text-xs sm:text-sm">
                {reviewSuccess && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-medium flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{reviewSuccess}</span>
                  </div>
                )}

                {reviewError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs font-medium flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span>{reviewError}</span>
                  </div>
                )}

                {/* 5-Star Rating Selector */}
                <div className="space-y-1">
                  <label className="block font-semibold text-[#000B4D] text-xs">
                    Your Rating <span className="text-rose-600">*</span>
                  </label>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2.5">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="w-10 h-10 min-w-[44px] min-h-[44px] p-0 rounded-lg hover:bg-amber-100/60 transition-colors focus:outline-none cursor-pointer flex items-center justify-center shrink-0"
                          title={`${star} star${star > 1 ? "s" : ""}`}
                        >
                          <Star
                            className={`w-6 h-6 transition-colors ${
                              star <= (hoverRating || rating)
                                ? "text-amber-400 fill-amber-400"
                                : "text-slate-300"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    <span className="text-xs font-medium text-slate-600">
                      {hoverRating || rating ? `${hoverRating || rating} of 5` : "Select rating"}
                    </span>
                  </div>
                </div>

                {/* Review Comment Text Area */}
                <div className="space-y-1">
                  <label className="block font-semibold text-[#000B4D] text-xs">
                    Your Feedback <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={`Tell others about your experience with ${business.name}...`}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A8A2E] text-xs font-normal"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmittingReview || rating === 0}
                  className="px-5 py-2.5 bg-[#1A8A2E] hover:bg-[#147024] text-white text-xs sm:text-sm font-medium rounded-lg border border-[#1A8A2E] transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer min-h-[44px]"
                >
                  {isSubmittingReview ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Submitting Review...</span>
                    </>
                  ) : (
                    <span>Submit Review</span>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Customer Reviews List */}
          <div className="space-y-2.5 pt-0.5">
            <h3 className="text-xs sm:text-sm font-semibold text-[#000B4D] flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
              <span>Customer Reviews</span>
              <span className="text-xs font-normal text-slate-500">({reviewsCount})</span>
            </h3>

            {reviewsList.length === 0 ? (
              <div className="py-6 text-center bg-slate-50/70 rounded-xl border border-dashed border-slate-200 text-slate-500 space-y-1">
                <Star className="w-7 h-7 text-slate-300 mx-auto" />
                <p className="text-xs sm:text-sm font-semibold text-slate-700">No reviews yet</p>
                <p className="text-xs text-slate-500">
                  Be the first to share your experience with this business!
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {reviewsList.slice(0, visibleReviewsCount).map((rev) => (
                  <div
                    key={rev.id}
                    className="p-3 sm:p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/70 space-y-1.5 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#000B4D] text-white font-semibold text-[11px] flex items-center justify-center shrink-0">
                          {(rev.user?.name || "C").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-semibold text-[#000B4D] text-xs block">
                            {rev.user?.name || "Community Member"}
                          </span>
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-3 h-3 ${
                                  star <= rev.rating
                                    ? "text-amber-400 fill-amber-400"
                                    : "text-slate-300"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 font-normal">
                          {new Date(rev.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                        {session?.user && (session.user as any).id !== rev.user?.id && (
                          reportedReviewIds.includes(rev.id) ? (
                            <span className="text-xs font-medium text-slate-400 flex items-center gap-1 cursor-default select-none">
                              <Check className="w-3.5 h-3.5 text-slate-400" />
                              <span>Reported</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenReportModal(rev)}
                              className="text-xs font-medium text-slate-400 hover:text-rose-600 flex items-center gap-1 transition-colors cursor-pointer min-h-[44px]"
                              title="Report this review"
                            >
                              <Flag className="w-3.5 h-3.5" />
                              <span>Report</span>
                            </button>
                          )
                        )}
                      </div>
                    </div>

                    {rev.comment && (
                      <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed font-normal pt-0.5 whitespace-pre-line">
                        &ldquo;{rev.comment}&rdquo;
                      </p>
                    )}
                  </div>
                ))}

                {/* Show More Reviews Pagination Button */}
                {reviewsList.length > visibleReviewsCount && (
                  <div className="pt-1 text-center">
                    <button
                      type="button"
                      onClick={() => setVisibleReviewsCount((prev) => prev + 5)}
                      className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-medium rounded-xl transition-all border border-slate-200/80 shadow-2xs cursor-pointer min-h-[44px]"
                    >
                      Show More Reviews ({reviewsList.length - visibleReviewsCount} remaining)
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION 6: CONTACT US (Desktop 2-row layout + Social bar) */}
        {/* ========================================================= */}
        <section id="contact" className="bg-white p-3.5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="space-y-0.5">
            <h2 className="text-sm sm:text-base font-semibold text-[#000B4D] flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#1A8A2E]" />
              Come visit us & say hello
            </h2>
            <p className="text-xs text-slate-500 font-normal">
              Direct contact info, operating hours, and location in Tamil Nadu.
            </p>
          </div>

          {/* Row 1: Contact Information (left) & Enquiry Form (right) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 sm:gap-5 items-start">
            {/* Contact Information */}
            <div id="contact-info-card" className="p-3.5 sm:p-4 bg-slate-50/80 rounded-xl border border-slate-200/70 space-y-3 h-full">
              <h3 className="font-semibold text-[#000B4D] text-xs sm:text-sm flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-[#1A8A2E]" />
                Contact Information
              </h3>

              <div className="space-y-2.5 text-xs sm:text-sm">
                {/* 3-line Address */}
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-0.5">
                    Address
                  </span>
                  <div className="leading-snug space-y-0.5 text-xs">
                    <div className="font-semibold text-[#000B4D] text-xs sm:text-sm">
                      {addressLines.line1}
                    </div>
                    <div className="font-normal text-slate-600">
                      {addressLines.line2}
                    </div>
                    <div className="font-normal text-slate-500">
                      {addressLines.line3}
                    </div>
                  </div>
                </div>

                {allPhones.length > 0 && (
                  <div className="pt-2 border-t border-slate-200/60">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-0.5">
                      {allPhones.length > 1 ? "Phone Numbers" : "Phone"}
                    </span>
                    <div className="space-y-1">
                      {allPhones.map((p, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 flex-wrap">
                          <a
                            href={telHref(p.number)}
                            className="text-[#0463A5] font-medium hover:underline text-xs sm:text-sm inline-block [overflow-wrap:anywhere]"
                          >
                            {p.number}
                          </a>
                          {p.label && (
                            <span className="text-[11px] text-slate-400 font-normal">
                              ({p.label})
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {business.email && (
                  <div className="pt-2 border-t border-slate-200/60">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-0.5">
                      Email
                    </span>
                    <a
                      href={`mailto:${business.email}`}
                      className="text-[#0463A5] font-medium hover:underline text-xs sm:text-sm inline-block [overflow-wrap:anywhere] break-all"
                    >
                      {business.email}
                    </a>
                  </div>
                )}

                {business.website && (
                  <div className="pt-2 border-t border-slate-200/60">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-0.5">
                      Website
                    </span>
                    <a
                      href={
                        business.website.startsWith("http")
                          ? business.website
                          : `https://${business.website}`
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#0463A5] font-medium hover:underline text-xs sm:text-sm inline-flex items-center gap-1.5 [overflow-wrap:anywhere] break-all"
                    >
                      <span>{business.website}</span>
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Enquiry Form */}
            {business.whatsapp && formattedWa ? (
              <div className="p-3.5 sm:p-4 bg-slate-50/80 rounded-xl border border-slate-200/70 space-y-2.5 h-full">
                <div>
                  <h3 className="font-semibold text-[#000B4D] text-xs sm:text-sm flex items-center gap-1.5">
                    <Send className="w-4 h-4 text-[#1A8A2E]" />
                    Send a Quick Enquiry
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    This opens WhatsApp with your message ready to send.
                  </p>
                </div>

                {enquirySent && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-medium flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Opening WhatsApp chat with your message...</span>
                  </div>
                )}

                <form onSubmit={handleEnquirySubmit} className="space-y-2.5 text-xs">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-[#000B4D]">
                      Your Name <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={enquiryName}
                      onChange={(e) => setEnquiryName(e.target.value)}
                      placeholder="e.g. Rahul Menon"
                      className={`w-full px-3 py-1.5 bg-white border rounded-lg text-xs font-normal focus:outline-none focus:ring-2 focus:ring-[#1A8A2E] ${
                        enquiryErrors.name ? "border-rose-400" : "border-slate-300"
                      }`}
                    />
                    {enquiryErrors.name && (
                      <p className="text-xs text-rose-600 font-medium">{enquiryErrors.name}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-[#000B4D]">
                      Your Phone Number <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="tel"
                      value={enquiryPhone}
                      onChange={(e) => setEnquiryPhone(e.target.value)}
                      placeholder="e.g. +91 98765 43210"
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-normal focus:outline-none focus:ring-2 focus:ring-[#1A8A2E]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-[#000B4D]">
                      Message / Question <span className="text-rose-600">*</span>
                    </label>
                    <textarea
                      rows={3}
                      value={enquiryMessage}
                      onChange={(e) => setEnquiryMessage(e.target.value)}
                      placeholder={`Hi, I would like to enquire about ${business.name}...`}
                      className={`w-full px-3 py-1.5 bg-white border rounded-lg text-xs font-normal focus:outline-none focus:ring-2 focus:ring-[#1A8A2E] ${
                        enquiryErrors.message ? "border-rose-400" : "border-slate-300"
                      }`}
                    />
                    {enquiryErrors.message && (
                      <p className="text-xs text-rose-600 font-medium">{enquiryErrors.message}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-[#25D366] hover:bg-[#20bd5a] text-white font-medium text-xs sm:text-sm rounded-lg transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px]"
                  >
                    <WhatsAppIcon className="w-4 h-4 fill-white shrink-0" />
                    <span>Chat via WhatsApp</span>
                  </button>
                </form>
              </div>
            ) : (
              <div className="p-5 bg-slate-50/80 rounded-xl border border-slate-200/70 text-center space-y-2.5 flex flex-col justify-center items-center h-full">
                <Phone className="w-7 h-7 text-[#1A8A2E]" />
                <h3 className="text-xs sm:text-sm font-semibold text-[#000B4D]">Have an enquiry?</h3>
                <p className="text-xs text-slate-600 max-w-md">
                  {business.phone ? (
                    <>
                      Give us a call directly at{" "}
                      <a href={`tel:${business.phone}`} className="font-medium text-[#1A8A2E] underline">
                        {business.phone}
                      </a>{" "}
                      to check availability or ask questions.
                    </>
                  ) : (
                    "Feel free to visit our location in Tamil Nadu or reach out via email."
                  )}
                </p>
                {business.phone && (
                  <a
                    href={`tel:${business.phone}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1A8A2E] hover:bg-[#147024] text-white font-medium text-xs sm:text-sm rounded-lg transition-all shadow-2xs min-h-[44px]"
                  >
                    <Phone className="w-4 h-4" />
                    Call Now
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Row 2: Map (wider, 7 cols) with Business Hours (5 cols) beside it */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-5 items-start">
            {/* Embedded Google Maps (Wider) */}
            <div className="lg:col-span-7 space-y-2">
              <div className="rounded-xl overflow-hidden border border-slate-200/90 bg-slate-100 h-56 sm:h-64 relative shadow-inner">
                <iframe
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  allowFullScreen
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(mapEmbedQuery)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                />
              </div>

              <a
                href={directionsUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium rounded-xl text-xs sm:text-sm transition-colors border border-slate-200/80 min-h-[44px]"
              >
                <Navigation className="w-3.5 h-3.5 text-[#1A8A2E]" />
                Open in Google Maps
              </a>
            </div>

            {/* Business Hours: 2-column grid [1fr auto], 12px gap, min-height 44px, sans-serif tabular-nums */}
            <div id="business-hours-card" className="lg:col-span-5 p-3.5 sm:p-4 bg-slate-50/80 rounded-xl border border-slate-200/70 space-y-2.5">
              <h3 className="font-semibold text-[#000B4D] text-xs sm:text-sm flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#1A8A2E]" />
                Business Hours
              </h3>

              {business.businessHours && business.businessHours.length > 0 ? (
                <div className="space-y-1">
                  {business.businessHours.map((hour) => {
                    const isToday = hour.day.toLowerCase() === currentDayName.toLowerCase();
                    return (
                      <div
                        key={hour.id}
                        className={`grid grid-cols-[1fr_auto] items-center gap-2.5 min-h-[44px] py-1 px-2.5 rounded-lg border transition-colors ${
                          isToday
                            ? "bg-[#EBF7ED] border-[#1A8A2E]/30 font-medium text-[#000B4D] shadow-2xs"
                            : "bg-white border-slate-200/60 text-slate-700"
                        }`}
                      >
                        {/* Day name and TODAY pill on left (pill wraps under day if narrow) */}
                        <div className="flex flex-col sm:flex-row sm:items-center items-start gap-0.5 sm:gap-1.5 min-w-0">
                          <span className="text-xs font-normal text-slate-800">{hour.day}</span>
                          {isToday && (
                            <span className="text-[10px] bg-[#1A8A2E] text-white px-1.5 py-0.5 rounded-full font-medium uppercase shrink-0">
                              Today
                            </span>
                          )}
                        </div>

                        {/* Time on right (sans-serif, tabular-nums, whitespace-nowrap, never wraps) */}
                        <div className="shrink-0 text-right">
                          {hour.closed ? (
                            <span className="text-rose-600 font-medium text-xs">Closed</span>
                          ) : (
                            <span className="text-slate-700 font-normal tabular-nums whitespace-nowrap tracking-tight sm:tracking-normal text-xs">
                              {hour.openingTime} - {hour.closingTime}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-500">Hours not specified.</p>
              )}
            </div>
          </div>

          {/* Row 3: Social & Direct Connect */}
          <div id="connect-directly-card" className="p-3 sm:p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/70 space-y-2.5">
            <div className="font-semibold text-[#000B4D] text-xs">
              Connect Directly with {business.name}
            </div>

            {/* Mobile: 2-column grid of equal-width buttons, min-height 44px, odd count spans 2 cols */}
            <div className="grid grid-cols-2 gap-2 sm:hidden">
              {business.website && (
                <a
                  href={
                    business.website.startsWith("http")
                      ? business.website
                      : `https://${business.website}`
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="min-h-[44px] flex items-center justify-center gap-1.5 px-2 py-1.5 bg-white hover:bg-[#EBF4FA] hover:text-[#0463A5] font-medium text-slate-700 rounded-xl border border-slate-200 transition-colors text-xs shadow-2xs text-center leading-tight"
                >
                  <Globe className="w-3.5 h-3.5 text-[#0463A5] shrink-0" />
                  <span>Website</span>
                </a>
              )}

              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="min-h-[44px] flex items-center justify-center gap-1.5 px-2 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-medium rounded-xl border border-emerald-200 transition-colors text-xs shadow-2xs text-center leading-tight"
                >
                  <WhatsAppIcon className="w-3.5 h-3.5 fill-[#25D366] shrink-0" />
                  <span>WhatsApp Chat</span>
                </a>
              )}

              {business.email && (
                <a
                  href={`mailto:${business.email}`}
                  className="min-h-[44px] flex items-center justify-center gap-1.5 px-2 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-medium rounded-xl border border-slate-200 transition-colors text-xs shadow-2xs text-center leading-tight"
                >
                  <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>Email Us</span>
                </a>
              )}

              {validatedSocialLinks.map((s) => (
                <a
                  key={s.platform}
                  href={s.url}
                  target="_blank"
                  rel="nofollow noopener noreferrer"
                  className="min-h-[44px] flex items-center justify-center gap-1.5 px-2 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-medium rounded-xl border border-slate-200 transition-colors text-xs shadow-2xs text-center leading-tight"
                >
                  <SocialIcon platform={s.platform} className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                  <span>{s.label}</span>
                </a>
              ))}

              <button
                type="button"
                onClick={handleShare}
                className={`min-h-[44px] flex items-center justify-center gap-1.5 px-2 py-1.5 bg-[#000B4D] hover:bg-slate-900 text-white font-medium rounded-xl transition-colors text-xs shadow-2xs cursor-pointer text-center leading-tight ${
                  ([business.website, whatsappUrl, business.email].filter(Boolean).length +
                    validatedSocialLinks.length +
                    1) %
                    2 !==
                  0
                    ? "col-span-2"
                    : ""
                }`}
              >
                <Share2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{copied ? "Link Copied!" : "Share Profile"}</span>
              </button>
            </div>

            {/* Desktop: Approved row layout */}
            <div className="hidden sm:flex flex-wrap gap-2 text-xs">
              {business.website && (
                <a
                  href={
                    business.website.startsWith("http")
                      ? business.website
                      : `https://${business.website}`
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#EBF4FA] hover:text-[#0463A5] font-medium text-slate-700 rounded-xl border border-slate-200 transition-colors min-h-[44px]"
                >
                  <Globe className="w-3.5 h-3.5 text-[#0463A5]" />
                  Website
                </a>
              )}

              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-medium rounded-xl border border-emerald-200 transition-colors min-h-[44px]"
                >
                  <WhatsAppIcon className="w-3.5 h-3.5 fill-[#25D366] shrink-0" />
                  WhatsApp Chat
                </a>
              )}

              {business.email && (
                <a
                  href={`mailto:${business.email}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-medium rounded-xl border border-slate-200 transition-colors min-h-[44px]"
                >
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  Email Us
                </a>
              )}

              {validatedSocialLinks.map((s) => (
                <a
                  key={s.platform}
                  href={s.url}
                  target="_blank"
                  rel="nofollow noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-medium rounded-xl border border-slate-200 transition-colors min-h-[44px]"
                >
                  <SocialIcon platform={s.platform} className="w-3.5 h-3.5 text-slate-600" />
                  {s.label}
                </a>
              ))}

              <button
                type="button"
                onClick={handleShare}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#000B4D] hover:bg-slate-900 text-white font-medium rounded-xl transition-colors min-h-[44px] cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                {copied ? "Link Copied!" : "Share Profile"}
              </button>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* RELATED BUSINESSES (Placed after Contact Us)              */}
        {/* ========================================================= */}
        {relatedBusinesses && relatedBusinesses.length > 0 && (
          <section className="bg-white p-3.5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3.5">
            <div className="space-y-0.5">
              <h2 className="text-sm sm:text-base font-semibold text-[#000B4D] flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-[#1A8A2E]" />
                Other places you might like in {business.category?.name}
              </h2>
              <p className="text-xs text-slate-500 font-normal">
                Discover other top-rated businesses and services in the same category.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
              {relatedBusinesses.map((rel) => {
                const relPhoto = rel.businessPhotos?.[0]?.imageUrl || null;
                return (
                  <Link
                    key={rel.id}
                    href={`/business/${rel.slug}`}
                    className="group bg-slate-50 hover:bg-white rounded-xl border border-slate-200/80 hover:border-[#1A8A2E]/60 hover:shadow-2xs transition-all overflow-hidden flex flex-col justify-between"
                  >
                    <div className="h-32 sm:h-36 bg-slate-200 relative overflow-hidden">
                      {relPhoto ? (
                        <img
                          src={relPhoto}
                          alt={rel.name}
                          className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-[#EBF7ED] text-[#1A8A2E] flex items-center justify-center font-bold text-xl">
                          <Building2 className="w-8 h-8 text-[#1A8A2E]" />
                        </div>
                      )}
                      {rel.verified && (
                        <span className="absolute top-2 right-2 bg-[#1A8A2E] text-white p-1 rounded-full shadow-xs">
                          <ShieldCheck className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>

                    <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between text-xs">
                      <div>
                        <div className="text-[11px] font-semibold text-[#1A8A2E] uppercase tracking-wider mb-0.5">
                          {rel.category?.name}
                        </div>
                        <h3 className="font-semibold text-[#000B4D] text-xs sm:text-sm group-hover:text-[#1A8A2E] transition-colors line-clamp-1">
                          {rel.name}
                        </h3>
                        <div className="flex items-center gap-1 text-slate-500 mt-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{rel.location?.name}</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-200/70 flex items-center justify-end text-[#0463A5] font-medium text-xs group-hover:translate-x-0.5 transition-transform">
                        View Details <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

      </main>

      {/* ========================================================= */}
      {/* SECTION 7: FOOTER (Full-bleed band, light bg #F8F9FA)     */}
      {/* ========================================================= */}
      <footer id="footer" className="w-full bg-[#F8F9FA] border-t border-slate-200 mt-10 sm:mt-12">
        <div className="max-w-[1040px] mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-7">
          {/* Main Footer Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 pb-6 border-b border-slate-200/80">
            {/* (1) Business Identity */}
            <div className="space-y-2">
              <h3 className="text-sm sm:text-base font-semibold text-[#000B4D]">{business.name}</h3>
              {business.description && (
                <p className="text-xs text-slate-500 leading-relaxed line-clamp-3 [overflow-wrap:anywhere]">
                  {business.description}
                </p>
              )}
              {business.updatedAt && (
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-normal pt-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>
                    Updated{" "}
                    {new Date(business.updatedAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              )}
            </div>

            {/* (2) Quick Navigation */}
            <div className="space-y-2.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                Quick Navigation
              </span>
              <ul className="space-y-2 text-xs">
                <li>
                  <a
                    href="#about"
                    className="text-slate-600 hover:text-[#000B4D] transition-colors inline-block py-0.5"
                  >
                    About Business
                  </a>
                </li>
                {business.businessServices && business.businessServices.length > 0 && (
                  <li>
                    <a
                      href="#services"
                      className="text-slate-600 hover:text-[#000B4D] transition-colors inline-block py-0.5"
                    >
                      Services & Offerings
                    </a>
                  </li>
                )}
                {business.businessPhotos && business.businessPhotos.length > 0 && (
                  <li>
                    <a
                      href="#gallery"
                      className="text-slate-600 hover:text-[#000B4D] transition-colors inline-block py-0.5"
                    >
                      Photo Gallery
                    </a>
                  </li>
                )}
                <li>
                  <a
                    href="#reviews"
                    className="text-slate-600 hover:text-[#000B4D] transition-colors inline-block py-0.5"
                  >
                    Customer Reviews
                  </a>
                </li>
                <li>
                  <a
                    href="#contact"
                    className="text-slate-600 hover:text-[#000B4D] transition-colors inline-block py-0.5"
                  >
                    Hours & Directions
                  </a>
                </li>
              </ul>
            </div>

            {/* (3) Location */}
            <div className="space-y-2.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                Location
              </span>
              <div className="text-xs leading-relaxed space-y-0.5">
                <div className="font-semibold text-slate-800">{addressLines.line1}</div>
                <div className="text-slate-600">{addressLines.line2}</div>
                <div className="text-slate-500">{addressLines.line3}</div>
              </div>
            </div>

            {/* (4) Direct Contact & Hours */}
            <div className="space-y-2.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                Contact & Hours
              </span>
              <div className="space-y-2 text-xs">
                {allPhones.length > 0 && (
                  <div>
                    <span className="text-slate-400 text-[11px] block">
                      {allPhones.length > 1 ? "Phone Numbers" : "Phone"}
                    </span>
                    <div className="space-y-1 mt-0.5">
                      {allPhones.map((p, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 flex-wrap">
                          <a
                            href={telHref(p.number)}
                            className="text-slate-700 hover:text-[#1A8A2E] font-medium transition-colors [overflow-wrap:anywhere]"
                          >
                            {p.number}
                          </a>
                          {p.label && (
                            <span className="text-slate-400 text-[11px]">
                              ({p.label})
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {business.email && (
                  <div>
                    <span className="text-slate-400 text-[11px] block">Email</span>
                    <a
                      href={`mailto:${business.email}`}
                      className="text-slate-700 hover:text-[#1A8A2E] font-medium transition-colors [overflow-wrap:anywhere] break-all"
                    >
                      {business.email}
                    </a>
                  </div>
                )}

                {todayHour && (
                  <div>
                    <span className="text-slate-400 text-[11px] block">Today&apos;s Hours</span>
                    <div className="text-slate-700">
                      {todayHour.closed ? (
                        <span className="text-rose-600 font-medium">Closed</span>
                      ) : (
                        <span className="tabular-nums">
                          {todayHour.openingTime} - {todayHour.closingTime}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Small icon-only social row in footer (hidden when there are none) */}
          {validatedSocialLinks.length > 0 && (
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between sm:justify-start gap-3">
              <span className="text-xs text-slate-400 font-medium">Follow us:</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {validatedSocialLinks.map((s) => (
                  <a
                    key={s.platform}
                    href={s.url}
                    target="_blank"
                    rel="nofollow noopener noreferrer"
                    aria-label={s.label}
                    title={s.label}
                    className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-[#000B4D] transition-colors"
                  >
                    <SocialIcon platform={s.platform} className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Sub-Footer Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <p>
              Listed on{" "}
              <Link href="/" className="font-medium text-[#000B4D] hover:text-[#1A8A2E] transition-colors">
                Namma Vanigam
              </Link>
            </p>
            <div className="flex items-center gap-3">
              <Link
                href="/#popular-categories"
                className="text-slate-600 hover:text-slate-900 transition-colors"
              >
                Browse Categories
              </Link>
              <span className="text-slate-300">•</span>
              <Link
                href="/add-business"
                className="inline-flex items-center px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-[#1A8A2E] font-medium border border-slate-200/90 shadow-2xs transition-colors"
              >
                Add Your Business
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Lightbox Modal (Logic & interactions 100% intact) */}
      {lightboxIndex !== null && business.businessPhotos[lightboxIndex] && (
        <div className="fixed inset-0 z-50 bg-[#000B4D]/90 backdrop-blur-md flex items-center justify-center p-4">
          <button
            type="button"
            onClick={closeLightbox}
            className="absolute top-4 right-4 p-2.5 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors z-50 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="Close Lightbox (Esc)"
          >
            <X className="w-6 h-6" />
          </button>

          <button
            type="button"
            onClick={prevLightbox}
            className="absolute left-4 p-3 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors z-50 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="Previous Photo"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            type="button"
            onClick={nextLightbox}
            className="absolute right-4 p-3 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors z-50 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="Next Photo"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          <div className="max-w-4xl max-h-[85vh] flex flex-col items-center justify-center">
            <img
              src={business.businessPhotos[lightboxIndex].imageUrl}
              alt={business.businessPhotos[lightboxIndex].altText || business.name}
              className="max-w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl"
            />
            <div className="mt-4 text-white text-sm font-semibold flex items-center gap-3 bg-white/10 px-5 py-2 rounded-full border border-white/10">
              <span>
                Photo {lightboxIndex + 1} of {business.businessPhotos.length}
              </span>
              {business.businessPhotos[lightboxIndex].altText && (
                <span>• {business.businessPhotos[lightboxIndex].altText}</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Review Report Confirmation Modal (Logic & interactions 100% intact) */}
      {reportingReview && (
        <div className="fixed inset-0 z-50 bg-[#000B4D]/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-1.5 text-rose-600">
                <Flag className="w-4 h-4" />
                <h3 className="text-sm sm:text-base font-semibold text-[#000B4D]">Report Review</h3>
              </div>
              <button
                type="button"
                onClick={handleCloseReportModal}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-slate-600">
              Report this review by <strong className="text-[#000B4D]">{reportingReview.user?.name || "Community Member"}</strong> to moderators for review.
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 font-normal italic">
              &ldquo;{reportingReview.comment || `${reportingReview.rating} Star Rating`}&rdquo;
            </div>

            {reportSuccess && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{reportSuccess}</span>
              </div>
            )}

            {reportError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{reportError}</span>
              </div>
            )}

            <form onSubmit={handleReportSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#000B4D]">
                  Reason for reporting <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={3}
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  placeholder="Tell us why this review violates community guidelines (spam, offensive, fake, etc.)..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none font-normal"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCloseReportModal}
                  disabled={isSubmittingReport}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-medium transition-colors cursor-pointer min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReport}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs sm:text-sm font-medium transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 min-h-[44px]"
                >
                  {isSubmittingReport ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <span>Submit Report</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
