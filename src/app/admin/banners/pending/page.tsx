"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Building2,
  MapPin,
  FolderTree,
  Mail,
  Calendar,
  AlertCircle,
  ExternalLink,
  Clock,
  ImageIcon,
} from "lucide-react";

interface PendingBannerBusiness {
  id: number;
  name: string;
  slug: string;
  bannerUrl: string | null;
  bannerPendingUrl: string;
  bannerSubmittedAt: string | null;
  createdAt: string;
  category: { id: number; name: string; slug: string };
  location: { id: number; name: string; slug: string; parent?: { id?: number; name: string; slug: string } | null };
  owner: { id: number; name: string; email: string; phone: string | null };
}

export default function AdminPendingBannersPage() {
  const [businesses, setBusinesses] = useState<PendingBannerBusiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  // Reject Modal State
  const [rejectItem, setRejectItem] = useState<PendingBannerBusiness | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectError, setRejectError] = useState<string | null>(null);

  const fetchPendingBanners = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/banners/pending");
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Failed to load pending banners");
      }
      const data = await res.json();
      setBusinesses(data);
    } catch (err: any) {
      setError(err.message || "Failed to load pending banners");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingBanners();
  }, []);

  const handleApprove = async (id: number) => {
    setActionLoadingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/banners/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to approve banner");
      }

      setBusinesses((prev) => prev.filter((b) => b.id !== id));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectItem) return;
    if (!rejectionReason.trim()) {
      setRejectError("Please provide a reason for banner rejection.");
      return;
    }

    setActionLoadingId(rejectItem.id);
    setRejectError(null);
    try {
      const res = await fetch(`/api/admin/banners/${rejectItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reject",
          rejectionReason: rejectionReason.trim(),
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to reject banner");
      }

      setBusinesses((prev) => prev.filter((b) => b.id !== rejectItem.id));
      setRejectItem(null);
      setRejectionReason("");
    } catch (err: any) {
      setRejectError(err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6 bg-white p-4 sm:p-6">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-brand-card p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-brand-navy flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-brand-green" />
            Banner Approvals Queue
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Review updated hero banner submissions from approved business listings. Approve to publish live or reject with constructive feedback.
          </p>
        </div>

        <button
          onClick={fetchPendingBanners}
          className="p-2 text-slate-600 hover:text-brand-navy bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium transition-colors"
          title="Refresh List"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="font-bold">✕</button>
        </div>
      )}

      {/* Main List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm flex flex-col items-center gap-2 bg-slate-50 rounded-xl border border-slate-200">
            <RefreshCw className="w-6 h-6 animate-spin text-brand-green" />
            Loading banner submissions...
          </div>
        ) : businesses.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm bg-slate-50 rounded-xl border border-slate-200">
            <CheckCircle2 className="w-8 h-8 text-brand-green mx-auto mb-2 opacity-80" />
            No pending banner submissions to review. All banners are up to date!
          </div>
        ) : (
          businesses.map((biz) => (
            <div
              key={biz.id}
              className="p-4 sm:p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4 hover:border-slate-300 transition-colors"
            >
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href={`/business/${biz.slug}`}
                      target="_blank"
                      className="text-base font-extrabold text-brand-navy hover:text-brand-green transition-colors inline-flex items-center gap-1.5"
                    >
                      <Building2 className="w-4 h-4 text-brand-green" />
                      <span>{biz.name}</span>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                    </Link>

                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 font-bold text-[10px] border border-amber-200">
                      <Clock className="w-3 h-3 text-amber-600" /> Banner Pending
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                    <span className="inline-flex items-center gap-1 text-[11px]">
                      <FolderTree className="w-3 h-3 text-slate-400" />
                      {biz.category?.name || "Uncategorized"}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px]">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {biz.location?.parent?.name
                        ? `${biz.location.name}, ${biz.location.parent.name}`
                        : biz.location?.name || "Tamil Nadu"}
                    </span>
                    <span className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-600">
                      <Mail className="w-3 h-3 text-slate-400" />
                      {biz.owner?.email || "No email"}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      Submitted{" "}
                      {biz.bannerSubmittedAt
                        ? new Date(biz.bannerSubmittedAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "Recently"}
                    </span>
                  </div>
                </div>

                {/* Actions Top Right */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      setRejectItem(biz);
                      setRejectionReason("");
                      setRejectError(null);
                    }}
                    disabled={actionLoadingId === biz.id}
                    className="min-h-[40px] px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg text-xs shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject Banner</span>
                  </button>

                  <button
                    onClick={() => handleApprove(biz.id)}
                    disabled={actionLoadingId === biz.id}
                    className="min-h-[40px] px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve Banner</span>
                  </button>
                </div>
              </div>

              {/* Previews Comparison Section */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Current Live Banner for comparison if one exists */}
                {biz.bannerUrl && (
                  <div className="lg:col-span-4 space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="text-[11px] uppercase font-bold text-slate-500 flex items-center justify-between">
                      <span>Current Live Banner</span>
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold">
                        Live Now
                      </span>
                    </span>
                    <div className="relative aspect-[16/6] w-full rounded-lg overflow-hidden border border-slate-200 bg-white">
                      <img
                        src={biz.bannerUrl}
                        alt="Current Live Banner"
                        className="w-full h-full object-cover object-center"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 italic">
                      Stays live on profile until new banner is approved.
                    </p>
                  </div>
                )}

                {/* New Pending Banner with Desktop & Mobile Crop Previews */}
                <div
                  className={`${
                    biz.bannerUrl ? "lg:col-span-8" : "lg:col-span-12"
                  } space-y-2 bg-amber-50/40 p-3 rounded-xl border border-amber-200/80`}
                >
                  <span className="text-[11px] uppercase font-bold text-amber-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>New Pending Banner Review</span>
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-500">
                        Desktop Crop Preview (~1600 × 600 px)
                      </span>
                      <div className="relative aspect-[16/6] w-full rounded-lg overflow-hidden border border-slate-200 bg-white">
                        <img
                          src={biz.bannerPendingUrl}
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
                          src={biz.bannerPendingUrl}
                          alt="Pending Banner Mobile Crop"
                          className="w-full h-full object-cover object-center"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Reject Modal */}
      {rejectItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-rose-50">
              <h3 className="text-base font-bold text-rose-800 flex items-center gap-2 truncate">
                <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <span className="truncate">Reject Banner: {rejectItem.name}</span>
              </h3>
              <button
                onClick={() => setRejectItem(null)}
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

              <p className="text-slate-600 leading-relaxed">
                Please provide clear feedback for the business owner explaining why this banner was rejected.
                {rejectItem.bannerUrl
                  ? " The current live banner will remain active on their profile."
                  : " No banner will be displayed on their profile until an approved one is uploaded."}
              </p>

              <div>
                <label className="block font-bold text-brand-navy mb-1.5">
                  Rejection Reason <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explain why the banner was rejected (e.g. Critical text was cut off on phone screens, resolution is pixelated, misleading promotional text, copyright issue...)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRejectItem(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors min-h-[44px]"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={actionLoadingId === rejectItem.id}
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
