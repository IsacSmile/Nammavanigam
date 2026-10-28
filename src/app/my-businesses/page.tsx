"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import {
  Building2,
  FolderTree,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  PlusCircle,
  LogOut,
  ExternalLink,
  Phone,
  MessageSquare,
  Globe,
  Mail,
  X,
  FileText,
  Sparkles,
  ImageIcon,
  ShieldCheck,
  Pencil,
} from "lucide-react";
import Header from "@/components/Header";
import { SocialIcon } from "@/components/SocialIcon";
import { PLATFORM_META, SocialPlatform } from "@/lib/contact";

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
}

export interface BusinessHour {
  id: number;
  day: string;
  openingTime: string | null;
  closingTime: string | null;
  closed: boolean;
}

export interface UserBusiness {
  id: number;
  name: string;
  slug: string;
  status: "pending" | "approved" | "rejected";
  rejectionReason: string | null;
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
  bannerStatus?: "none" | "pending" | "approved" | "rejected";
  bannerRejectionReason?: string | null;
  createdAt: string;
  updatedAt?: string;
  category: { id: number; name: string; slug: string };
  location: { id: number; name: string; slug: string; parent?: { id?: number; name: string; slug: string } | null };
  businessPhotos: BusinessPhoto[];
  businessServices: BusinessService[];
  businessHours: BusinessHour[];
  businessPhones?: { id: number; number: string; label?: string | null; sortOrder: number }[];
  businessSocialLinks?: { id: number; platform: string; url: string }[];
}

export default function MyBusinessesPage() {
  const { data: session, status: authStatus } = useSession();
  const user = session?.user;

  const [businesses, setBusinesses] = useState<UserBusiness[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Preview Modal State
  const [previewBusiness, setPreviewBusiness] = useState<UserBusiness | null>(null);

  useEffect(() => {
    if (authStatus === "authenticated") {
      fetchMyBusinesses();
    }
  }, [authStatus]);

  const fetchMyBusinesses = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/my-businesses");
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to load businesses");
      }
      const data = await res.json();
      setBusinesses(data);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  if (authStatus === "loading") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-xs text-slate-500 font-medium">
        Loading session...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-16">
      {/* Site-wide Header */}
      <Header />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-8">
        {/* Top Banner */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-brand-navy flex items-center gap-2">
              <Building2 className="w-6 h-6 text-brand-green" />
              My Business Listings
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Manage your submitted local business listings, track approval status, view feedback, and preview your listings.
            </p>
          </div>

          <Link
            href="/add-business"
            className="px-4 py-2.5 bg-brand-green hover:bg-brand-green-hover text-white font-bold rounded-xl text-xs transition-colors shadow-sm inline-flex items-center gap-2 shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            Add New Business
          </Link>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Loading Spinner */}
        {isLoading ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-500 text-xs font-semibold space-y-3">
            <div className="w-8 h-8 border-3 border-brand-green border-t-transparent rounded-full animate-spin mx-auto" />
            <p>Fetching your business listings...</p>
          </div>
        ) : businesses.length === 0 ? (
          /* Empty State */
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-4 max-w-lg mx-auto my-8">
            <div className="w-16 h-16 bg-brand-green-light text-brand-green rounded-full flex items-center justify-center mx-auto">
              <Building2 className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-brand-navy">No Business Listings Found</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              You haven’t added any business listings yet. Register your local shop, service, or company on Namma Vanigam to reach local customers.
            </p>
            <Link
              href="/add-business"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-green hover:bg-brand-green-hover text-white font-bold rounded-xl text-xs transition-colors shadow-sm"
            >
              <PlusCircle className="w-4 h-4" />
              Add Your Business
            </Link>
          </div>
        ) : (
          /* Business Listings Grid / Cards */
          <div className="grid grid-cols-1 gap-4 sm:gap-6">
            {businesses.map((biz) => {
              const coverPhoto = biz.businessPhotos?.[0]?.imageUrl || null;

              return (
                <div
                  key={biz.id}
                  className="bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-slate-300 transition-all overflow-hidden p-4 sm:p-5 flex flex-col md:flex-row gap-4 md:gap-6"
                >
                  {/* Photo Thumbnail / Logo Container */}
                  <div className="w-full md:w-48 h-40 sm:h-44 md:h-auto bg-slate-50/90 rounded-2xl border border-slate-200/70 shrink-0 relative overflow-hidden flex items-center justify-center p-4">
                    {coverPhoto ? (
                      <img
                        src={coverPhoto}
                        alt={biz.name}
                        className="w-full h-full object-contain max-h-36 rounded-xl"
                      />
                    ) : (
                      <div className="w-full h-full bg-brand-green-light text-brand-green flex flex-col items-center justify-center p-4 rounded-xl">
                        <Building2 className="w-9 h-9 text-brand-green mb-1" />
                        <span className="text-[10px] font-bold text-slate-400">No Photo</span>
                      </div>
                    )}

                    {/* Verified Badge */}
                    {biz.verified && (
                      <div className="absolute top-2.5 left-2.5">
                        <span className="p-1 rounded-full bg-emerald-600 text-white shadow-xs block" title="Verified Listing">
                          <ShieldCheck className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Listing Content Details */}
                  <div className="flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      {/* Top Badges & Status Row */}
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        {/* Category & Location */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-[11px] border border-emerald-200/60">
                            <FolderTree className="w-3 h-3 text-emerald-600" />
                            {biz.category?.name || "Category"}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 font-bold text-[11px] border border-sky-200/60">
                            <MapPin className="w-3 h-3 text-sky-600" />
                            {biz.location?.parent?.name
                              ? `${biz.location.name}, ${biz.location.parent.name}`
                              : biz.location?.name || "Tamil Nadu"}
                          </span>
                        </div>

                        {/* Status Badge & Banner Chip */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {biz.status === "approved" && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-extrabold text-[11px] border border-emerald-200 shadow-2xs whitespace-nowrap">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                              Approved
                            </span>
                          )}

                          {biz.status === "pending" && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 font-extrabold text-[11px] border border-amber-200 shadow-2xs whitespace-nowrap">
                              <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              Pending Approval
                            </span>
                          )}

                          {biz.status === "rejected" && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 font-extrabold text-[11px] border border-rose-200 shadow-2xs whitespace-nowrap">
                              <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                              Rejected
                            </span>
                          )}

                          {/* Banner Status Chips (shown only when pending or rejected) */}
                          {biz.bannerStatus === "pending" && (
                            <span
                              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold text-[10px] border border-amber-200 whitespace-nowrap"
                              title="Banner is pending review"
                            >
                              <Clock className="w-3 h-3 text-amber-500 shrink-0" />
                              Banner pending
                            </span>
                          )}

                          {biz.bannerStatus === "rejected" && (
                            <span
                              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold text-[10px] border border-rose-200 whitespace-nowrap"
                              title={biz.bannerRejectionReason ? `Banner rejected: ${biz.bannerRejectionReason}` : "Banner rejected"}
                            >
                              <AlertCircle className="w-3 h-3 text-rose-500 shrink-0" />
                              Banner rejected
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Business Title & Address */}
                      <div className="space-y-1">
                        {biz.status === "approved" ? (
                          <Link
                            href={`/business/${biz.slug}`}
                            className="text-lg font-extrabold text-slate-900 hover:text-brand-green transition-colors inline-flex items-center gap-1.5 tracking-tight group"
                          >
                            <span>{biz.name}</span>
                            <ExternalLink className="w-4 h-4 text-brand-blue shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                          </Link>
                        ) : (
                          <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                            {biz.name}
                          </h2>
                        )}

                        <p className="text-xs text-slate-500 font-medium flex items-start gap-1 leading-relaxed">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <span>
                            {biz.address ||
                              (biz.location?.parent?.name
                                ? `${biz.location.name}, ${biz.location.parent.name}, Tamil Nadu`
                                : biz.location?.name && biz.location.name !== "Tamil Nadu"
                                ? `${biz.location.name}, Tamil Nadu`
                                : "Tamil Nadu, India")}
                          </span>
                        </p>
                      </div>

                      {/* Submitted & Last Updated Date */}
                      <div className="text-[11px] text-slate-400 font-medium flex items-center gap-2.5 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          Submitted {formatDate(biz.createdAt)}
                        </span>
                        {biz.updatedAt && (
                          <span className="flex items-center gap-1 text-slate-400">
                            • Last updated {formatDate(biz.updatedAt)}
                          </span>
                        )}
                      </div>

                      {/* Rejection Reason Feedback Banner */}
                      {biz.status === "rejected" && (
                        <div className="p-3 bg-rose-50/80 border border-rose-200 rounded-2xl text-xs text-rose-800 space-y-1">
                          <span className="font-bold flex items-center gap-1 text-rose-900">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            Reason for Rejection:
                          </span>
                          <p className="pl-4 leading-relaxed font-medium text-rose-700">
                            {biz.rejectionReason || "No explicit reason specified by admin."}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons Grid */}
                    <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
                      <Link
                        href={`/my-businesses/${biz.id}/edit`}
                        className="flex-1 min-w-[120px] inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold transition-all text-xs whitespace-nowrap shadow-2xs active:scale-[0.99]"
                      >
                        <Pencil className="w-3.5 h-3.5 shrink-0" />
                        <span>Edit Listing</span>
                      </Link>

                      <button
                        onClick={() => setPreviewBusiness(biz)}
                        className="flex-1 min-w-[120px] inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-all text-xs whitespace-nowrap border border-slate-200/80 active:scale-[0.99]"
                      >
                        <Eye className="w-3.5 h-3.5 text-brand-blue shrink-0" />
                        <span>Preview</span>
                      </button>

                      {biz.status === "approved" && (
                        <Link
                          href={`/business/${biz.slug}`}
                          className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold transition-all text-xs whitespace-nowrap shadow-2xs active:scale-[0.99]"
                        >
                          <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                          <span>Public Page</span>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Submission Preview Modal */}
      {previewBusiness && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full my-4 sm:my-8 overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-brand-card border-b border-slate-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="w-8 h-8 rounded-lg bg-brand-green-light text-brand-green flex items-center justify-center font-bold shrink-0">
                  <Building2 className="w-4 h-4" />
                </div>
                <div className="overflow-hidden">
                  <h2 className="text-sm sm:text-base font-bold text-brand-navy truncate">
                    {previewBusiness.name}
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Submission Preview (ID: #{previewBusiness.id})
                  </p>
                </div>
              </div>

              <button
                onClick={() => setPreviewBusiness(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-brand-navy hover:bg-white transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-5 sm:space-y-6 text-xs">
              {/* Status Header inside Modal */}
              <div className="p-3.5 sm:p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50 border-slate-200">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Approval Status</span>
                  <div className="font-bold text-xs sm:text-sm text-brand-navy flex items-center gap-1.5">
                    {previewBusiness.status === "approved" && (
                      <span className="text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Approved & Published
                      </span>
                    )}
                    {previewBusiness.status === "pending" && (
                      <span className="text-amber-700 flex items-center gap-1">
                        <Clock className="w-4 h-4 text-amber-600 shrink-0" /> Pending Admin Review
                      </span>
                    )}
                    {previewBusiness.status === "rejected" && (
                      <span className="text-rose-700 flex items-center gap-1">
                        <XCircle className="w-4 h-4 text-rose-600 shrink-0" /> Listing Rejected
                      </span>
                    )}
                  </div>
                </div>

                <div className="sm:text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Submission Date</span>
                  <span className="font-bold text-slate-700">{formatDate(previewBusiness.createdAt)}</span>
                </div>
              </div>

              {/* Rejection Reason inside Modal */}
              {previewBusiness.status === "rejected" && previewBusiness.rejectionReason && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 space-y-1">
                  <span className="font-bold flex items-center gap-1 text-rose-900 text-xs">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" /> Admin Rejection Reason:
                  </span>
                  <p className="leading-relaxed font-medium pl-5">{previewBusiness.rejectionReason}</p>
                </div>
              )}

              {/* Category & Location */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Category</span>
                  <span className="font-bold text-brand-navy text-xs">{previewBusiness.category?.name}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Location</span>
                  <span className="font-bold text-brand-navy text-xs">
                    {previewBusiness.location?.parent?.name
                      ? `${previewBusiness.location.name}, ${previewBusiness.location.parent.name}`
                      : previewBusiness.location?.name}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <h3 className="font-bold text-brand-navy uppercase text-[11px] flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-brand-green" /> Description
                </h3>
                <p className="text-slate-600 leading-relaxed whitespace-pre-line bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  {previewBusiness.description || "No description provided."}
                </p>
              </div>

              {/* Contact Information */}
              <div className="space-y-2">
                <h3 className="font-bold text-brand-navy uppercase text-[11px] flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-brand-blue" /> Contact Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Phone: <strong>{previewBusiness.phone || "N/A"}</strong></span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>WhatsApp: <strong>{previewBusiness.whatsapp || "N/A"}</strong></span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2 overflow-hidden">
                    <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="truncate">Email: <strong>{previewBusiness.email || "N/A"}</strong></span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2 overflow-hidden">
                    <Globe className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="truncate">Website: <strong>{previewBusiness.website || "N/A"}</strong></span>
                  </div>
                </div>

                {/* Additional Phones */}
                {previewBusiness.businessPhones && previewBusiness.businessPhones.length > 0 && (
                  <div className="pt-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Additional Phone Numbers
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {previewBusiness.businessPhones.map((p) => (
                        <div
                          key={p.id}
                          className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs flex items-center gap-1.5"
                        >
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-semibold text-brand-navy">{p.number}</span>
                          {p.label && <span className="text-slate-500 text-[11px]">({p.label})</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Social Links */}
                {previewBusiness.businessSocialLinks && previewBusiness.businessSocialLinks.length > 0 && (
                  <div className="pt-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Social Media Links
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {previewBusiness.businessSocialLinks.map((s) => (
                        <a
                          key={s.id}
                          href={s.url}
                          target="_blank"
                          rel="nofollow noopener noreferrer"
                          className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs flex items-center gap-1.5 text-brand-navy transition-colors"
                        >
                          <SocialIcon platform={s.platform} className="w-3.5 h-3.5 text-slate-600" />
                          <span className="font-semibold capitalize">
                            {PLATFORM_META[s.platform.toLowerCase() as SocialPlatform]?.label || s.platform}:
                          </span>
                          <span className="text-slate-500 text-[11px] truncate max-w-xs">{s.url}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Photo Gallery */}
              {previewBusiness.businessPhotos && previewBusiness.businessPhotos.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-bold text-brand-navy uppercase text-[11px] flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-brand-blue" /> Uploaded Photos ({previewBusiness.businessPhotos.length})
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {previewBusiness.businessPhotos.map((photo) => (
                      <div key={photo.id} className="h-24 sm:h-28 rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                        <img
                          src={photo.imageUrl}
                          alt={photo.altText || previewBusiness.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Services */}
              {previewBusiness.businessServices && previewBusiness.businessServices.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-bold text-brand-navy uppercase text-[11px] flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" /> Services & Products ({previewBusiness.businessServices.length})
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {previewBusiness.businessServices.map((svc) => (
                      <div key={svc.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-start">
                        <div>
                          <p className="font-bold text-brand-navy">{svc.serviceName}</p>
                          {svc.description && <p className="text-[11px] text-slate-500">{svc.description}</p>}
                        </div>
                        {svc.price && (
                          <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 shrink-0 ml-2">
                            ₹{String(svc.price)}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Link
                  href={`/my-businesses/${previewBusiness.id}/edit`}
                  className="w-full sm:w-auto px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold rounded-xl text-xs transition-colors inline-flex items-center justify-center gap-1.5 text-center"
                >
                  <Pencil className="w-3.5 h-3.5 text-amber-600" />
                  Edit Listing
                </Link>

                {previewBusiness.status === "approved" && (
                  <Link
                    href={`/business/${previewBusiness.slug}`}
                    className="w-full sm:w-auto px-4 py-2 bg-brand-green hover:bg-brand-green-hover text-white font-bold rounded-xl text-xs transition-colors shadow-sm inline-flex items-center justify-center gap-1.5 text-center"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View Public Page
                  </Link>
                )}
              </div>

              <button
                onClick={() => setPreviewBusiness(null)}
                className="w-full sm:w-auto px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs transition-colors text-center"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
