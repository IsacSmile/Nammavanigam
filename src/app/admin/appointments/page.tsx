"use client";

import React, { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import {
  CalendarCheck,
  CheckCircle2,
  RotateCcw,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Phone,
  Clock,
  MessageSquare,
  AlertCircle,
  X,
  Loader2,
} from "lucide-react";
import { telHref } from "@/lib/contact";
import {
  formatDateLabel,
  formatTimeLabel,
  formatSubmittedAt,
} from "@/lib/appointments";

export interface AppointmentItem {
  id: number;
  name: string;
  phone: string;
  appointmentDate: string;
  appointmentTime: string;
  message: string | null;
  status: "pending" | "handled";
  createdAt: string;
}

export interface AppointmentCounts {
  all: number;
  pending: number;
  handled: number;
}

type TabType = "all" | "pending" | "handled";

export default function AdminAppointmentsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [items, setItems] = useState<AppointmentItem[]>([]);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState<AppointmentCounts>({
    all: 0,
    pending: 0,
    handled: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Expanded messages state for "Show more" / "Show less"
  const [expandedMessages, setExpandedMessages] = useState<Record<number, boolean>>({});

  // Delete confirm modal state
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchAppointments = useCallback(async (isSilent = false) => {
    if (!isSilent) {
      setLoading(true);
    }
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/appointments?status=${activeTab}&page=${currentPage}`
      );
      if (!res.ok) {
        if (res.status === 403) {
          throw new Error("Access denied. Admin privileges required.");
        }
        throw new Error("Failed to load appointment requests.");
      }
      const data = await res.json();
      setItems(data.items || []);
      setTotal(data.total || 0);
      if (data.counts) {
        setCounts(data.counts);
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      if (!isSilent) {
        setLoading(false);
      }
    }
  }, [activeTab, currentPage]);

  useEffect(() => {
    fetchAppointments(false);
    const interval = setInterval(() => {
      fetchAppointments(true);
    }, 15000);
    return () => clearInterval(interval);
  }, [fetchAppointments]);

  const toggleExpandMessage = (id: number) => {
    setExpandedMessages((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Optimistic status update with rollback
  const handleToggleStatus = async (item: AppointmentItem) => {
    const newStatus: "pending" | "handled" =
      item.status === "pending" ? "handled" : "pending";

    const prevItems = [...items];
    const prevCounts = { ...counts };

    // Optimistically update list
    setItems((prev) =>
      prev.map((it) => (it.id === item.id ? { ...it, status: newStatus } : it))
    );

    // Optimistically update counts
    setCounts((prev) => {
      if (newStatus === "handled") {
        return {
          ...prev,
          pending: Math.max(0, prev.pending - 1),
          handled: prev.handled + 1,
        };
      } else {
        return {
          ...prev,
          pending: prev.pending + 1,
          handled: Math.max(0, prev.handled - 1),
        };
      }
    });

    try {
      const res = await fetch(`/api/admin/appointments/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update appointment status.");
      }

      toast.success(
        newStatus === "handled"
          ? "Marked request as handled"
          : "Reopened appointment request"
      );
    } catch (err: any) {
      // Rollback on failure
      setItems(prevItems);
      setCounts(prevCounts);
      toast.error(err.message || "Failed to update status. Rolled back changes.");
    }
  };

  // Confirm delete handler
  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;

    setIsDeleting(true);
    const targetId = deleteTargetId;

    try {
      const res = await fetch(`/api/admin/appointments/${targetId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete appointment request.");
      }

      toast.success("Appointment request deleted.");
      setDeleteTargetId(null);
      // Refresh list to update pagination & counts accurately
      fetchAppointments();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete appointment.");
    } finally {
      setIsDeleting(false);
    }
  };

  const totalPages = Math.ceil(total / 20) || 1;

  return (
    <div className="space-y-6 bg-white p-4 sm:p-6 min-h-[calc(100vh-4rem)]">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-brand-card p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-brand-navy flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-[#1A8A2E]" />
            Appointment Requests
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Review and manage customer appointment inquiries submitted across the site.
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          {/* Refresh button */}
          <button
            type="button"
            onClick={() => fetchAppointments(false)}
            title="Refresh appointments"
            disabled={loading}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-brand-navy transition-all shadow-xs disabled:opacity-50 cursor-pointer"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#1A8A2E]" : ""}`} />
          </button>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold flex-1 sm:flex-initial">
            <button
              type="button"
              onClick={() => {
                setActiveTab("all");
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === "all"
                  ? "bg-white text-brand-navy shadow-xs"
                  : "text-slate-600 hover:text-brand-navy"
              }`}
            >
              All ({counts.all})
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("pending");
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === "pending"
                  ? "bg-[#1A8A2E] text-white shadow-xs"
                  : "text-slate-600 hover:text-brand-navy"
              }`}
            >
              <span>New</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  activeTab === "pending"
                    ? "bg-white/20 text-white"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {counts.pending}
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("handled");
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === "handled"
                  ? "bg-white text-brand-navy shadow-xs"
                  : "text-slate-600 hover:text-brand-navy"
              }`}
            >
              Handled ({counts.handled})
            </button>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div
          role="alert"
          className="flex items-center gap-2 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium"
        >
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 text-slate-500 space-y-2">
          <Loader2 className="w-6 h-6 animate-spin text-[#1A8A2E]" />
          <p className="text-xs font-medium">Loading appointments...</p>
        </div>
      ) : items.length === 0 ? (
        /* Empty State */
        <div className="p-12 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <CalendarCheck className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-700">
            No appointment requests yet.
          </p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            When visitors request appointments from the website, their inquiries will appear here.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table View (Hidden on mobile) */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Requested</th>
                  <th className="py-3.5 px-4">Name</th>
                  <th className="py-3.5 px-4">Mobile</th>
                  <th className="py-3.5 px-4 max-w-xs">Message</th>
                  <th className="py-3.5 px-4">Submitted</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => {
                  const isPending = item.status === "pending";
                  const isExpanded = !!expandedMessages[item.id];
                  const hasLongMessage = (item.message || "").length > 80;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      {/* Requested Date & Time */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-900">
                          {formatDateLabel(item.appointmentDate)}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{formatTimeLabel(item.appointmentTime)}</span>
                        </div>
                      </td>

                      {/* Name */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-semibold text-slate-900">
                          {item.name}
                        </span>
                      </td>

                      {/* Mobile (tel link) */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <a
                          href={telHref(item.phone)}
                          className="inline-flex items-center gap-1.5 text-[#1A8A2E] hover:underline font-semibold"
                        >
                          <Phone className="w-3.5 h-3.5 text-[#1A8A2E]" />
                          <span>{item.phone}</span>
                        </a>
                      </td>

                      {/* Message (clamped with Show more, plain text only) */}
                      <td className="py-3.5 px-4 max-w-xs">
                        {item.message ? (
                          <div className="space-y-1">
                            <p
                              className={`whitespace-pre-wrap break-words text-slate-600 ${
                                !isExpanded ? "line-clamp-2" : ""
                              }`}
                            >
                              {item.message}
                            </p>
                            {hasLongMessage && (
                              <button
                                type="button"
                                onClick={() => toggleExpandMessage(item.id)}
                                className="text-[11px] font-semibold text-[#1A8A2E] hover:underline"
                              >
                                {isExpanded ? "Show less" : "Show more"}
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">None</span>
                        )}
                      </td>

                      {/* Submitted At (India time) */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-500">
                        {formatSubmittedAt(item.createdAt)}
                      </td>

                      {/* Status Chip */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isPending ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            New
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Handled
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(item)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                              isPending
                                ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200"
                                : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                            }`}
                            title={isPending ? "Mark handled" : "Reopen"}
                          >
                            {isPending ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Mark handled</span>
                              </>
                            ) : (
                              <>
                                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                                <span>Reopen</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeleteTargetId(item.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete"
                            aria-label={`Delete appointment for ${item.name}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Stacked Cards (Visible on mobile only) */}
          <div className="md:hidden space-y-4">
            {items.map((item) => {
              const isPending = item.status === "pending";
              const isExpanded = !!expandedMessages[item.id];
              const hasLongMessage = (item.message || "").length > 80;

              return (
                <div
                  key={item.id}
                  className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-3"
                >
                  {/* Top card bar: status & requested date */}
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div>
                      <div className="font-bold text-sm text-slate-900">
                        {formatDateLabel(item.appointmentDate)}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatTimeLabel(item.appointmentTime)}</span>
                      </div>
                    </div>

                    {isPending ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        New
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Handled
                      </span>
                    )}
                  </div>

                  {/* Customer Info */}
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Customer:</span>
                      <span className="font-semibold text-slate-900">
                        {item.name}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Mobile:</span>
                      <a
                        href={telHref(item.phone)}
                        className="inline-flex items-center gap-1 font-semibold text-[#1A8A2E] hover:underline"
                      >
                        <Phone className="w-3 h-3" />
                        <span>{item.phone}</span>
                      </a>
                    </div>

                    <div className="flex items-center justify-between text-slate-400 text-[11px] pt-0.5">
                      <span>Submitted:</span>
                      <span>{formatSubmittedAt(item.createdAt)}</span>
                    </div>
                  </div>

                  {/* Message (plain text only) */}
                  {item.message && (
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-500 font-semibold mb-1">
                        <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                        <span>Message:</span>
                      </div>
                      <p
                        className={`whitespace-pre-wrap break-words text-slate-700 ${
                          !isExpanded ? "line-clamp-2" : ""
                        }`}
                      >
                        {item.message}
                      </p>
                      {hasLongMessage && (
                        <button
                          type="button"
                          onClick={() => toggleExpandMessage(item.id)}
                          className="text-[11px] font-semibold text-[#1A8A2E] hover:underline mt-1 block"
                        >
                          {isExpanded ? "Show less" : "Show more"}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Full-width 44px Action Targets */}
                  <div className="pt-1 flex flex-col sm:flex-row gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(item)}
                      className={`w-full min-h-[44px] py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
                        isPending
                          ? "bg-[#1A8A2E] hover:bg-[#147024] text-white shadow-xs"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                      }`}
                    >
                      {isPending ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Mark handled</span>
                        </>
                      ) : (
                        <>
                          <RotateCcw className="w-4 h-4" />
                          <span>Reopen Request</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeleteTargetId(item.id)}
                      className="w-full min-h-[44px] py-2.5 px-4 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-200 text-xs">
              <span className="text-slate-500 font-medium">
                Page {currentPage} of {totalPages} ({total} total requests)
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-2 rounded-lg border border-slate-200 text-slate-600 hover:text-brand-navy hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-semibold flex items-center gap-1 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-2 rounded-lg border border-slate-200 text-slate-600 hover:text-brand-navy hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-semibold flex items-center gap-1 transition-colors"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTargetId !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-confirm-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-2xs p-4"
        >
          <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl space-y-4 text-brand-navy">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <button
                type="button"
                onClick={() => setDeleteTargetId(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1">
              <h3
                id="delete-confirm-title"
                className="text-base font-bold text-slate-900"
              >
                Delete this request?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                This can&apos;t be undone.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteTargetId(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
