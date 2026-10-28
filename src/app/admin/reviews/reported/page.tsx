"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Flag,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Star,
  Building2,
  Calendar,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  ChevronLeft,
} from "lucide-react";

interface Report {
  id: number;
  reason: string | null;
  createdAt: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
}

interface ReportedReview {
  id: number;
  rating: number;
  comment: string | null;
  createdAt: string;
  business: {
    id: number;
    name: string;
    slug: string;
  };
  user: {
    id: number;
    name: string;
    email: string;
  };
  reports: Report[];
}

export default function AdminReportedReviewsPage() {
  const [reviews, setReviews] = useState<ReportedReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchReportedReviews = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/reviews/reported");
      if (!res.ok) {
        if (res.status === 403) {
          throw new Error("Access denied. Admin privileges required.");
        }
        throw new Error("Failed to load reported reviews.");
      }
      const data = await res.json();
      setReviews(data.reportedReviews || []);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportedReviews();
  }, []);

  const handleDeleteReview = async (reviewId: number) => {
    if (!confirm("Are you sure you want to permanently delete this review? This action cannot be undone.")) {
      return;
    }

    setActionLoadingId(reviewId);
    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete review.");
      }

      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      setToastMessage("Review successfully deleted.");
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      alert(err.message || "Failed to delete review.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDismissReports = async (reviewId: number) => {
    setActionLoadingId(reviewId);
    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}/reports`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to dismiss reports.");
      }

      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      setToastMessage("Reports successfully dismissed.");
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      alert(err.message || "Failed to dismiss reports.");
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 border border-rose-200 rounded-full flex items-center gap-1">
              <Flag className="w-3 h-3" /> Moderation Queue
            </span>
          </div>
          <h1 className="text-xl font-bold text-brand-navy flex items-center gap-2">
            Reported Reviews
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Review user-flagged content, delete abusive reviews, or dismiss unfounded reports.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/businesses/pending"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200"
          >
            <ChevronLeft className="w-4 h-4" /> Pending Approvals
          </Link>
          <button
            onClick={fetchReportedReviews}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-green hover:bg-brand-green-hover text-white transition-colors disabled:opacity-50 shadow-2xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Toast Banner */}
      {toastMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold flex items-center gap-2 shadow-xs">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Content Loading / Empty / List */}
      {loading ? (
        <div className="py-20 text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-brand-green mx-auto mb-3" />
          <p className="text-slate-500 text-xs font-medium">Loading reported reviews...</p>
        </div>
      ) : reviews.length === 0 ? (
        <div className="py-16 text-center bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
          <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto mb-3 opacity-80" />
          <h3 className="text-sm font-bold text-brand-navy mb-1">No Reported Reviews</h3>
          <p className="text-slate-500 text-xs max-w-sm mx-auto">
            There are currently no reviews flagged for moderation. All reviews are clean!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-xs text-slate-500 font-medium px-1">
            Showing {reviews.length} reported review{reviews.length !== 1 ? "s" : ""}
          </div>

          {reviews.map((rev) => (
            <div
              key={rev.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 hover:border-slate-300 transition-colors"
            >
              {/* Header: Business info & Reviewer */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
                <div>
                  <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-semibold mb-0.5">
                    <Building2 className="w-3.5 h-3.5 text-brand-green" />
                    <span>Business Listing:</span>
                  </div>
                  <Link
                    href={`/business/${rev.business.slug}`}
                    target="_blank"
                    className="text-base font-bold text-brand-navy hover:text-brand-green flex items-center gap-1.5 transition-colors"
                  >
                    {rev.business.name}
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  </Link>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-600 border border-rose-200 flex items-center gap-1">
                    <Flag className="w-3 h-3" />
                    {rev.reports.length} Report{rev.reports.length !== 1 ? "s" : ""}
                  </span>

                  <button
                    onClick={() => handleDismissReports(rev.id)}
                    disabled={actionLoadingId === rev.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors disabled:opacity-50 border border-slate-200 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Dismiss Reports
                  </button>

                  <button
                    onClick={() => handleDeleteReview(rev.id)}
                    disabled={actionLoadingId === rev.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-colors disabled:opacity-50 shadow-2xs cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Review
                  </button>
                </div>
              </div>

              {/* Review Body */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-brand-navy text-white font-bold text-xs flex items-center justify-center">
                      {rev.user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-brand-navy">{rev.user.name}</span>
                      <span className="text-[11px] text-slate-400 ml-1.5">({rev.user.email})</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-amber-500 bg-amber-50 px-2 py-0.5 rounded text-xs font-bold border border-amber-200">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{rev.rating} / 5</span>
                  </div>
                </div>

                <p className="text-slate-700 text-xs leading-relaxed font-medium pt-1 whitespace-pre-line">
                  {rev.comment ? `"${rev.comment}"` : <em className="text-slate-400">No written comment provided</em>}
                </p>

                <div className="text-[11px] text-slate-400 font-medium pt-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <span>Posted on {new Date(rev.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })}</span>
                </div>
              </div>

              {/* Reports List */}
              <div className="pt-1">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-rose-600 mb-2 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" /> Report Details ({rev.reports.length})
                </h4>
                <div className="space-y-2">
                  {rev.reports.map((rep) => (
                    <div
                      key={rep.id}
                      className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs text-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div className="space-y-0.5">
                        <div className="font-semibold text-slate-800">
                          Reported by <span className="text-brand-navy font-bold">{rep.user.name}</span> ({rep.user.email})
                        </div>
                        {rep.reason ? (
                          <div className="text-slate-700 bg-white rounded-lg px-2.5 py-1 text-xs border border-slate-200 mt-1 italic font-medium">
                            &ldquo;{rep.reason}&rdquo;
                          </div>
                        ) : (
                          <div className="text-slate-400 italic text-[11px]">No specific reason provided</div>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0 self-start sm:self-center font-medium">
                        {new Date(rep.createdAt).toLocaleDateString("en-IN", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
