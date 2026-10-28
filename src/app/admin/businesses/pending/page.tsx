"use client";

import { useState, useEffect } from "react";
import {
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  RefreshCw,
  Building2,
  MapPin,
  FolderTree,
  Mail,
  Phone,
  Globe,
  Navigation,
  Calendar,
  AlertCircle,
  FileText,
  Sparkles,
} from "lucide-react";

interface BusinessPhoto {
  id: number;
  imageUrl: string;
  altText: string | null;
  sortOrder: number;
}

interface BusinessService {
  id: number;
  serviceName: string;
  description: string | null;
  price: string | number | null;
}

interface BusinessHour {
  id: number;
  day: string;
  openingTime: string | null;
  closingTime: string | null;
  closed: boolean;
}

interface PendingBusiness {
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
  createdAt: string;
  category: { id: number; name: string; slug: string };
  location: { id: number; name: string; slug: string };
  owner: { id: number; name: string; email: string; phone: string | null };
  businessPhotos: BusinessPhoto[];
  businessServices: BusinessService[];
  businessHours: BusinessHour[];
  bannerUrl?: string | null;
  bannerPendingUrl?: string | null;
  bannerStatus?: string;
  bannerRejectionReason?: string | null;
  bannerSubmittedAt?: string | null;
}

export default function AdminPendingBusinessesPage() {
  const [businesses, setBusinesses] = useState<PendingBusiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  // Preview Drawer Modal
  const [previewBusiness, setPreviewBusiness] = useState<PendingBusiness | null>(null);

  // Reject Modal State
  const [rejectBusiness, setRejectBusiness] = useState<PendingBusiness | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectError, setRejectError] = useState<string | null>(null);

  // Approve Listing, Reject Banner Modal State
  const [rejectBannerBusiness, setRejectBannerBusiness] = useState<PendingBusiness | null>(null);
  const [bannerRejectReason, setBannerRejectReason] = useState("");
  const [bannerRejectError, setBannerRejectError] = useState<string | null>(null);

  const fetchPendingBusinesses = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/businesses?status=pending");
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setBusinesses(data);
    } catch (err: any) {
      setError(err.message || "Failed to load pending businesses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingBusinesses();
  }, []);

  const handleApprove = async (id: number) => {
    setActionLoadingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/businesses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved" }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to approve business");
      }

      // Remove approved item from state
      setBusinesses((prev) => prev.filter((b) => b.id !== id));
      if (previewBusiness?.id === id) setPreviewBusiness(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectBusiness) return;
    if (!rejectionReason.trim()) {
      setRejectError("Please provide a reason for rejection.");
      return;
    }

    setActionLoadingId(rejectBusiness.id);
    setRejectError(null);
    try {
      const res = await fetch(`/api/admin/businesses/${rejectBusiness.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "rejected",
          rejectionReason: rejectionReason.trim(),
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to reject business");
      }

      setBusinesses((prev) => prev.filter((b) => b.id !== rejectBusiness.id));
      if (previewBusiness?.id === rejectBusiness.id) setPreviewBusiness(null);
      setRejectBusiness(null);
      setRejectionReason("");
    } catch (err: any) {
      setRejectError(err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleApproveRejectBannerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectBannerBusiness) return;
    if (!bannerRejectReason.trim()) {
      setBannerRejectError("Please provide a reason for rejecting the banner.");
      return;
    }

    setActionLoadingId(rejectBannerBusiness.id);
    setBannerRejectError(null);
    try {
      const res = await fetch(`/api/admin/businesses/${rejectBannerBusiness.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "approved",
          rejectBanner: true,
          bannerRejectionReason: bannerRejectReason.trim(),
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to approve business and reject banner");
      }

      setBusinesses((prev) => prev.filter((b) => b.id !== rejectBannerBusiness.id));
      if (previewBusiness?.id === rejectBannerBusiness.id) setPreviewBusiness(null);
      setRejectBannerBusiness(null);
      setBannerRejectReason("");
    } catch (err: any) {
      setBannerRejectError(err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6 bg-white">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-brand-card p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-brand-navy flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" />
            Pending Business Submissions
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Review new business submissions for verification, inspect photos, preview details, and approve or reject submissions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchPendingBusinesses}
            className="p-2 text-slate-600 hover:text-brand-navy bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium transition-colors"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="font-bold">✕</button>
        </div>
      )}

      {/* Pending Businesses Table & Cards */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm flex flex-col items-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-brand-green" />
            Loading pending submissions...
          </div>
        ) : businesses.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            <CheckCircle2 className="w-8 h-8 text-brand-green mx-auto mb-2 opacity-80" />
            No pending submissions to review. All submissions are processed!
          </div>
        ) : (
          <>
            {/* Desktop Table View (lg+) */}
            <table className="hidden lg:table w-full text-left text-xs border-collapse">
              <thead className="bg-brand-card text-brand-navy border-b border-slate-200 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 whitespace-nowrap">Business Name</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Category</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Location</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Owner Email</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Submitted Date</th>
                  <th className="py-3.5 px-4 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {businesses.map((b) => (
                  <tr key={b.id} className="hover:bg-brand-card transition-colors">
                    <td className="py-3.5 px-4 font-bold text-brand-navy whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-brand-green shrink-0" />
                        <span>{b.name}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-700 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-brand-green-light text-brand-green font-semibold text-[11px] whitespace-nowrap">
                        <FolderTree className="w-3 h-3 shrink-0" />
                        {b.category?.name || "Uncategorized"}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-700 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-brand-blue-light text-brand-blue font-semibold text-[11px] whitespace-nowrap">
                        <MapPin className="w-3 h-3 shrink-0" />
                        {b.location?.name || "Unspecified"}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px] whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{b.owner?.email || b.email || "N/A"}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                      {new Date(b.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                        <button
                          onClick={() => setPreviewBusiness(b)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-brand-blue-light hover:text-brand-blue text-slate-700 font-semibold rounded-lg text-xs transition-colors"
                          title="Preview Submission Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Preview
                        </button>

                        {b.bannerPendingUrl && (
                          <button
                            onClick={() => {
                              setRejectBannerBusiness(b);
                              setBannerRejectReason("");
                              setBannerRejectError(null);
                            }}
                            disabled={actionLoadingId === b.id}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg text-xs shadow-sm transition-colors disabled:opacity-50"
                            title="Approve listing, reject banner"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            Approve, Reject Banner
                          </button>
                        )}

                        <button
                          onClick={() => handleApprove(b.id)}
                          disabled={actionLoadingId === b.id}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs shadow-sm transition-colors disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Approve
                        </button>

                        <button
                          onClick={() => {
                            setRejectBusiness(b);
                            setRejectionReason("");
                            setRejectError(null);
                          }}
                          disabled={actionLoadingId === b.id}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg text-xs shadow-sm transition-colors disabled:opacity-50"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile / Tablet Stacked Cards View (< lg) */}
            <div className="block lg:hidden divide-y divide-slate-200">
              {businesses.map((b) => (
                <div key={b.id} className="p-4 space-y-3 bg-white hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <Building2 className="w-5 h-5 text-brand-green shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <h4 className="font-bold text-brand-navy text-sm truncate">{b.name}</h4>
                        <div className="flex items-center gap-1 font-mono text-[11px] text-slate-500 truncate">
                          <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{b.owner?.email || b.email || "No email"}</span>
                        </div>
                      </div>
                    </div>

                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-semibold shrink-0">
                      <Clock className="w-3.5 h-3.5 text-amber-600" /> Pending
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-brand-green-light text-brand-green font-semibold text-[11px]">
                        <FolderTree className="w-3 h-3" />
                        {b.category?.name || "Uncategorized"}
                      </span>

                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-brand-blue-light text-brand-blue font-semibold text-[11px]">
                        <MapPin className="w-3 h-3" />
                        {b.location?.name || "Unspecified"}
                      </span>
                    </div>

                    <span className="text-[11px] text-slate-400">
                      Submitted {new Date(b.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </span>
                  </div>

                  {/* Touch-friendly Action Buttons (min 44px target) */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => setPreviewBusiness(b)}
                      className="min-h-[44px] min-w-[44px] px-3.5 py-2 bg-slate-100 hover:bg-brand-blue-light hover:text-brand-blue text-slate-700 font-semibold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Preview</span>
                    </button>

                    {b.bannerPendingUrl && (
                      <button
                        onClick={() => {
                          setRejectBannerBusiness(b);
                          setBannerRejectReason("");
                          setBannerRejectError(null);
                        }}
                        disabled={actionLoadingId === b.id}
                        className="min-h-[44px] px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg text-xs shadow-sm transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>Approve, Reject Banner</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setRejectBusiness(b);
                        setRejectionReason("");
                        setRejectError(null);
                      }}
                      disabled={actionLoadingId === b.id}
                      className="min-h-[44px] min-w-[44px] px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg text-xs shadow-sm transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject</span>
                    </button>

                    <button
                      onClick={() => handleApprove(b.id)}
                      disabled={actionLoadingId === b.id}
                      className="min-h-[44px] min-w-[44px] px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs shadow-sm transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Approve</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Preview Modal / Drawer */}
      {previewBusiness && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-end">
          <div className="bg-white w-full max-w-full sm:max-w-xl h-full shadow-2xl flex flex-col overflow-hidden border-l border-slate-200 animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-brand-card shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <Building2 className="w-5 h-5 text-brand-green shrink-0" />
                <h3 className="text-base font-bold text-brand-navy truncate">
                  {previewBusiness.name}
                </h3>
              </div>
              <button
                onClick={() => setPreviewBusiness(null)}
                className="text-slate-400 hover:text-brand-navy font-bold text-lg p-1 shrink-0"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-xs text-slate-700">
              {/* Category & Location Badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-1 rounded bg-brand-green-light text-brand-green font-bold text-xs flex items-center gap-1">
                  <FolderTree className="w-3.5 h-3.5" /> {previewBusiness.category?.name}
                </span>
                <span className="px-2.5 py-1 rounded bg-brand-blue-light text-brand-blue font-bold text-xs flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> {previewBusiness.location?.name}
                </span>
                <span className="px-2.5 py-1 rounded bg-amber-50 text-amber-700 border border-amber-200 font-bold text-xs flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Pending Review
                </span>
              </div>

              {/* Pending Banner Section */}
              {previewBusiness.bannerPendingUrl && (
                <div className="p-3 bg-amber-50/50 border border-amber-200 rounded-xl space-y-2">
                  <h4 className="font-bold text-amber-900 flex items-center gap-1.5 text-xs uppercase tracking-wide">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    Pending Business Banner Review
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="sm:col-span-2 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-500">
                        Desktop Crop Preview (~1600 × 600 px)
                      </span>
                      <div className="relative aspect-[16/6] w-full rounded-lg overflow-hidden border border-slate-200 bg-white">
                        <img
                          src={previewBusiness.bannerPendingUrl}
                          alt="Pending Banner Desktop Crop"
                          className="w-full h-full object-cover object-center"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-500">
                        Mobile Crop Preview (16:9)
                      </span>
                      <div className="relative aspect-[16/9] w-full rounded-lg overflow-hidden border border-slate-200 bg-white">
                        <img
                          src={previewBusiness.bannerPendingUrl}
                          alt="Pending Banner Mobile Crop"
                          className="w-full h-full object-cover object-center"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Photos Gallery */}
              {previewBusiness.businessPhotos && previewBusiness.businessPhotos.length > 0 && (
                <div>
                  <h4 className="font-bold text-brand-navy mb-2 flex items-center gap-1.5 text-xs uppercase tracking-wide">
                    Uploaded Photos ({previewBusiness.businessPhotos.length})
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {previewBusiness.businessPhotos.map((photo) => (
                      <a
                        key={photo.id}
                        href={photo.imageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="group relative h-24 rounded-lg overflow-hidden border border-slate-200 bg-slate-100"
                      >
                        <img
                          src={photo.imageUrl}
                          alt={photo.altText || previewBusiness.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              <div>
                <h4 className="font-bold text-brand-navy mb-1.5 flex items-center gap-1.5 text-xs uppercase tracking-wide">
                  <FileText className="w-3.5 h-3.5 text-slate-400" /> Description
                </h4>
                <p className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-slate-600 leading-relaxed whitespace-pre-line">
                  {previewBusiness.description || "No description provided."}
                </p>
              </div>

              {/* Contact Information */}
              <div className="space-y-2">
                <h4 className="font-bold text-brand-navy mb-2 text-xs uppercase tracking-wide">Contact Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Owner Email</span>
                    <span className="font-semibold text-brand-navy break-all">{previewBusiness.owner?.email}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Phone Number</span>
                    <span className="font-semibold text-brand-navy">{previewBusiness.phone || "Not set"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">WhatsApp</span>
                    <span className="font-semibold text-brand-navy">{previewBusiness.whatsapp || "Not set"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Website</span>
                    <span className="font-semibold text-brand-navy truncate block">
                      {previewBusiness.website ? (
                        <a href={previewBusiness.website} target="_blank" rel="noreferrer" className="text-brand-blue hover:underline">
                          {previewBusiness.website}
                        </a>
                      ) : (
                        "Not set"
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Address & Coordinates */}
              <div>
                <h4 className="font-bold text-brand-navy mb-1.5 text-xs uppercase tracking-wide flex items-center gap-1">
                  <Navigation className="w-3.5 h-3.5 text-brand-blue" /> Address & Coordinates
                </h4>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                  <p className="text-slate-700 font-medium">{previewBusiness.address || "Address not provided"}</p>
                  {previewBusiness.latitude !== null && previewBusiness.longitude !== null && (
                    <p className="text-slate-500 font-mono text-[11px]">
                      GPS: {previewBusiness.latitude}, {previewBusiness.longitude}
                    </p>
                  )}
                </div>
              </div>

              {/* Services Offered */}
              {previewBusiness.businessServices && previewBusiness.businessServices.length > 0 && (
                <div>
                  <h4 className="font-bold text-brand-navy mb-2 text-xs uppercase tracking-wide">
                    Services / Products ({previewBusiness.businessServices.length})
                  </h4>
                  <div className="divide-y divide-slate-200 bg-slate-50 rounded-lg border border-slate-200">
                    {previewBusiness.businessServices.map((svc) => (
                      <div key={svc.id} className="p-2.5 flex items-center justify-between gap-2">
                        <div>
                          <p className="font-bold text-brand-navy">{svc.serviceName}</p>
                          {svc.description && <p className="text-[11px] text-slate-500">{svc.description}</p>}
                        </div>
                        {svc.price && (
                          <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 shrink-0">
                            ₹{svc.price}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Operating Hours */}
              {previewBusiness.businessHours && previewBusiness.businessHours.length > 0 && (
                <div>
                  <h4 className="font-bold text-brand-navy mb-2 text-xs uppercase tracking-wide flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" /> Business Hours
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                    {previewBusiness.businessHours.map((h) => (
                      <div key={h.id} className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-slate-700">{h.day}:</span>
                        {h.closed ? (
                          <span className="text-rose-600 font-bold">Closed</span>
                        ) : (
                          <span className="text-slate-600 font-mono">
                            {h.openingTime} - {h.closingTime}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Action Buttons */}
            <div className="p-4 border-t border-slate-200 bg-brand-card flex items-center justify-end gap-2.5 flex-wrap shrink-0">
              <button
                onClick={() => {
                  setRejectBusiness(previewBusiness);
                  setRejectionReason("");
                  setRejectError(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg text-xs transition-colors shadow-sm inline-flex items-center gap-1.5 min-h-[44px]"
              >
                <XCircle className="w-4 h-4" /> Reject Listing
              </button>

              {previewBusiness.bannerPendingUrl && (
                <button
                  onClick={() => {
                    setRejectBannerBusiness(previewBusiness);
                    setBannerRejectReason("");
                    setBannerRejectError(null);
                  }}
                  disabled={actionLoadingId === previewBusiness.id}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg text-xs transition-colors shadow-sm inline-flex items-center gap-1.5 min-h-[44px] disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" /> Approve Listing, Reject Banner
                </button>
              )}

              <button
                onClick={() => handleApprove(previewBusiness.id)}
                disabled={actionLoadingId === previewBusiness.id}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs transition-colors shadow-sm inline-flex items-center gap-1.5 disabled:opacity-50 min-h-[44px]"
              >
                <CheckCircle2 className="w-4 h-4" /> Approve Business & Banner
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approve Listing, Reject Banner Modal */}
      {rejectBannerBusiness && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-amber-50">
              <h3 className="text-base font-bold text-amber-900 flex items-center gap-2 truncate">
                <Sparkles className="w-5 h-5 text-amber-600 shrink-0" />
                <span className="truncate">Approve Listing, Reject Banner: {rejectBannerBusiness.name}</span>
              </h3>
              <button
                onClick={() => setRejectBannerBusiness(null)}
                className="text-slate-400 hover:text-brand-navy font-bold text-lg p-1 shrink-0"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleApproveRejectBannerSubmit} className="p-4 sm:p-6 space-y-4 text-xs">
              {bannerRejectError && (
                <div className="p-3 bg-rose-100 border border-rose-200 text-rose-700 rounded-lg font-medium">
                  {bannerRejectError}
                </div>
              )}

              <p className="text-slate-600 leading-relaxed">
                The business listing will be published immediately as <strong>Approved</strong>, but the submitted banner will be <strong>Rejected</strong> and omitted from the live profile.
              </p>

              <div>
                <label className="block font-bold text-brand-navy mb-1.5">
                  Banner Rejection Reason <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={bannerRejectReason}
                  onChange={(e) => setBannerRejectReason(e.target.value)}
                  placeholder="Explain why the banner was rejected (e.g. Low resolution, text cropped on mobile, inappropriate imagery, trademark violation...)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  This reason will be visible to the business owner so they can upload an adjusted replacement banner.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRejectBannerBusiness(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors min-h-[44px]"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={actionLoadingId === rejectBannerBusiness.id}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50 min-h-[44px]"
                >
                  Confirm: Approve Listing & Reject Banner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectBusiness && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-rose-50">
              <h3 className="text-base font-bold text-rose-800 flex items-center gap-2 truncate">
                <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <span className="truncate">Reject: {rejectBusiness.name}</span>
              </h3>
              <button
                onClick={() => setRejectBusiness(null)}
                className="text-slate-400 hover:text-brand-navy font-bold text-lg p-1 shrink-0"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRejectSubmit} className="p-4 sm:p-6 space-y-4 text-xs">
              {rejectError && (
                <div className="p-3 bg-rose-100 border border-rose-200 text-rose-700 rounded-lg font-medium">
                  {rejectError}
                </div>
              )}

              <div>
                <label className="block font-bold text-brand-navy mb-1.5">
                  Rejection Reason <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explain clearly why this submission was rejected (e.g. Invalid contact info, missing business address, duplicate submission, inappropriate content...)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 text-xs"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  This reason will be stored under the business record for administrative reference and partner feedback.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRejectBusiness(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors min-h-[44px]"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={actionLoadingId === rejectBusiness.id}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50 min-h-[44px]"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
