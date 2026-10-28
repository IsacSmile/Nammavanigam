"use client";

import React, { useState, useRef } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { CalendarCheck } from "lucide-react";

// Lazy load the modal on first click
const AppointmentModal = dynamic(() => import("./AppointmentModal"), {
  ssr: false,
});

const EXCLUDED_PREFIXES = [
  "/admin",
  "/login",
  "/register",
  "/dashboard",
  "/my-businesses",
  "/add-business",
];

export default function BookAppointmentButton() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Exclude specified paths
  if (pathname && EXCLUDED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return null;
  }

  const handleOpen = () => {
    setHasOpened(true);
    setIsOpen(true);
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleOpen}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label="Book Appointment"
        className="fixed right-4 bottom-[calc(16px+env(safe-area-inset-bottom))] z-40 flex items-center gap-2.5 min-h-[48px] px-5 py-3 rounded-full bg-[#1A8A2E] hover:bg-[#147024] text-white font-semibold text-sm shadow-lg shadow-black/15 hover:shadow-xl transition-all duration-200 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#1A8A2E]"
      >
        <CalendarCheck className="w-5 h-5 shrink-0" />
        <span>Book Appointment</span>
      </button>

      {hasOpened && (
        <AppointmentModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          triggerRef={buttonRef}
        />
      )}
    </>
  );
}
