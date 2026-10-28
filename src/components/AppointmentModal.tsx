"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, CalendarCheck, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import {
  istNow,
  addDays,
  validateAppointmentInput,
  formatDateLabel,
  formatTimeLabel,
  AppointmentFieldErrors,
} from "@/lib/appointments";

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}

interface SubmittedInfo {
  name: string;
  phone: string;
  date: string;
  time: string;
}

export default function AppointmentModal({
  isOpen,
  onClose,
  triggerRef,
}: AppointmentModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [message, setMessage] = useState("");
  const [bHp, setBHp] = useState(""); // Honeypot field

  const [errors, setErrors] = useState<AppointmentFieldErrors>({});
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedData, setSubmittedData] = useState<SubmittedInfo | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Compute minimum (today) and maximum (today + 90 days) dates in Asia/Kolkata
  const now = istNow();
  const minDate = now.date;
  const maxDate = addDays(now.date, 90);

  // Reset form state whenever modal is opened
  useEffect(() => {
    if (isOpen) {
      setName("");
      setPhone("");
      setDate("");
      setTime("");
      setMessage("");
      setBHp("");
      setErrors({});
      setBannerError(null);
      setIsSubmitting(false);
      setSubmittedData(null);
    }
  }, [isOpen]);

  // Lock body scroll while modal is open
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Focus management: move focus to first field on open, trap focus, return on close
  useEffect(() => {
    if (!isOpen) return;

    // Small delay to ensure modal is mounted and visible
    const timer = setTimeout(() => {
      firstInputRef.current?.focus();
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
        return;
      }

      if (e.key === "Tab") {
        if (!modalRef.current) return;
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input:not([tabindex="-1"]), select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstEl = focusableElements[0];
        const lastEl = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstEl) {
            e.preventDefault();
            lastEl.focus();
          }
        } else {
          if (document.activeElement === lastEl) {
            e.preventDefault();
            firstEl.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleClose = () => {
    onClose();
    // Return focus to trigger button
    setTimeout(() => {
      triggerRef.current?.focus();
    }, 50);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setBannerError(null);

    // Validate on the client with the same shared helper
    const validation = validateAppointmentInput({
      name,
      phone,
      date,
      time,
      message,
    });

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          phone,
          date,
          time,
          message,
          b_hp: bHp, // honeypot
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 201 || res.status === 200) {
        // Success
        setSubmittedData({
          name: validation.values.name,
          phone: validation.values.phone,
          date: validation.values.date,
          time: validation.values.time,
        });
      } else if (res.status === 400 && data.errors) {
        // Validation errors returned by server
        setErrors(data.errors);
      } else if (res.status === 409 || res.status === 429 || res.status === 500) {
        setBannerError(
          data.error || "Could not send your request. Please try again."
        );
      } else {
        setBannerError(
          data.error || "Could not send your request. Please try again."
        );
      }
    } catch {
      setBannerError("Could not send your request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-xs transition-opacity duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="appointment-modal-title"
        className="relative w-full md:max-w-[480px] bg-white rounded-t-2xl md:rounded-2xl shadow-2xl max-h-[90dvh] flex flex-col overflow-hidden text-brand-navy"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-emerald-50 text-[#1A8A2E] flex items-center justify-center shrink-0">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="appointment-modal-title"
                className="text-base font-bold text-slate-900 leading-tight"
              >
                Book Appointment
              </h2>
              <p className="text-xs text-slate-500">
                Schedule a consultation or service visit
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1A8A2E]"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content area: scrollable if content overflows 90dvh */}
        <div className="p-6 overflow-y-auto">
          {submittedData ? (
            /* Success State */
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 bg-emerald-100 text-[#1A8A2E] rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-slate-900">
                  Appointment Requested!
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed max-w-sm mx-auto">
                  Thank you,{" "}
                  <span className="font-semibold text-slate-900">
                    {submittedData.name.trim().split(" ")[0]}
                  </span>
                  ! We&apos;ve received your request for{" "}
                  <span className="font-semibold text-slate-900">
                    {formatDateLabel(submittedData.date)}
                  </span>{" "}
                  at{" "}
                  <span className="font-semibold text-slate-900">
                    {formatTimeLabel(submittedData.time)}
                  </span>
                  . We&apos;ll contact you on{" "}
                  <span className="font-semibold text-slate-900">
                    {submittedData.phone}
                  </span>
                  .
                </p>
              </div>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full py-3 px-4 rounded-xl bg-[#1A8A2E] hover:bg-[#147024] text-white font-semibold text-sm transition-colors shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#1A8A2E]"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            /* Form State */
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {/* Top Banner Error for 409, 429, 500 */}
              {bannerError && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                  <span>{bannerError}</span>
                </div>
              )}

              {/* Honeypot field (hidden from screen readers & visual users) */}
              <div
                style={{
                  position: "absolute",
                  left: "-9999px",
                  opacity: 0,
                  height: 0,
                  overflow: "hidden",
                }}
                aria-hidden="true"
              >
                <input
                  type="text"
                  name="b_hp"
                  id="appointment-b-hp"
                  tabIndex={-1}
                  autoComplete="off"
                  value={bHp}
                  onChange={(e) => setBHp(e.target.value)}
                />
              </div>

              {/* Full Name */}
              <div>
                <label
                  htmlFor="appointment-name"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Full name <span className="text-rose-500">*</span>
                </label>
                <input
                  ref={firstInputRef}
                  type="text"
                  id="appointment-name"
                  name="name"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul Nair"
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? "appointment-name-error" : undefined}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1A8A2E] ${
                    errors.name
                      ? "border-rose-400 bg-rose-50/20"
                      : "border-slate-300 focus:border-[#1A8A2E]"
                  }`}
                />
                {errors.name && (
                  <p
                    id="appointment-name-error"
                    role="alert"
                    className="text-xs text-rose-600 mt-1 font-medium"
                  >
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Mobile Number */}
              <div>
                <label
                  htmlFor="appointment-phone"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Mobile number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  id="appointment-phone"
                  name="phone"
                  inputMode="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  aria-invalid={!!errors.phone}
                  aria-describedby={errors.phone ? "appointment-phone-error" : undefined}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1A8A2E] ${
                    errors.phone
                      ? "border-rose-400 bg-rose-50/20"
                      : "border-slate-300 focus:border-[#1A8A2E]"
                  }`}
                />
                {errors.phone && (
                  <p
                    id="appointment-phone-error"
                    role="alert"
                    className="text-xs text-rose-600 mt-1 font-medium"
                  >
                    {errors.phone}
                  </p>
                )}
              </div>

              {/* Date & Time Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Preferred Date */}
                <div>
                  <label
                    htmlFor="appointment-date"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    Preferred date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="appointment-date"
                    name="date"
                    min={minDate}
                    max={maxDate}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    aria-invalid={!!errors.date}
                    aria-describedby={errors.date ? "appointment-date-error" : undefined}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1A8A2E] ${
                      errors.date
                        ? "border-rose-400 bg-rose-50/20"
                        : "border-slate-300 focus:border-[#1A8A2E]"
                    }`}
                  />
                  {errors.date && (
                    <p
                      id="appointment-date-error"
                      role="alert"
                      className="text-xs text-rose-600 mt-1 font-medium"
                    >
                      {errors.date}
                    </p>
                  )}
                </div>

                {/* Preferred Time */}
                <div>
                  <label
                    htmlFor="appointment-time"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    Preferred time <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="time"
                    id="appointment-time"
                    name="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    aria-invalid={!!errors.time}
                    aria-describedby={errors.time ? "appointment-time-error" : undefined}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1A8A2E] ${
                      errors.time
                        ? "border-rose-400 bg-rose-50/20"
                        : "border-slate-300 focus:border-[#1A8A2E]"
                    }`}
                  />
                  {errors.time && (
                    <p
                      id="appointment-time-error"
                      role="alert"
                      className="text-xs text-rose-600 mt-1 font-medium"
                    >
                      {errors.time}
                    </p>
                  )}
                </div>
              </div>

              {/* Message (Optional) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor="appointment-message"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Message{" "}
                    <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {message.length} / 500
                  </span>
                </div>
                <textarea
                  id="appointment-message"
                  name="message"
                  maxLength={500}
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us any specific requirements or questions..."
                  aria-invalid={!!errors.message}
                  aria-describedby={
                    errors.message ? "appointment-message-error" : undefined
                  }
                  className={`w-full px-3.5 py-2 rounded-xl border text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1A8A2E] resize-none ${
                    errors.message
                      ? "border-rose-400 bg-rose-50/20"
                      : "border-slate-300 focus:border-[#1A8A2E]"
                  }`}
                />
                {errors.message && (
                  <p
                    id="appointment-message-error"
                    role="alert"
                    className="text-xs text-rose-600 mt-1 font-medium"
                  >
                    {errors.message}
                  </p>
                )}
              </div>

              {/* Helper text near the button */}
              <p className="text-[11px] text-slate-500 leading-relaxed pt-1">
                We&apos;ll use these details only to contact you about your appointment.
              </p>

              {/* Submit button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full min-h-[48px] py-3 px-4 rounded-xl bg-[#1A8A2E] hover:bg-[#147024] disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors shadow-sm flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#1A8A2E]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending request...</span>
                  </>
                ) : (
                  <span>Request Appointment</span>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
