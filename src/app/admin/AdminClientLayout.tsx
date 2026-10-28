"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  FolderTree,
  MapPin,
  ShieldCheck,
  ShieldAlert,
  LogOut,
  User,
  Clock,
  Building2,
  Menu,
  X,
  Flag,
  ImageIcon,
  CalendarCheck,
} from "lucide-react";
import { showLogoutToast } from "@/lib/toast";

export default function AdminClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const user = session?.user;
  const isAdminUser = user?.role === "admin";
  const [pendingBannerCount, setPendingBannerCount] = useState<number>(0);
  const [pendingAppointmentCount, setPendingAppointmentCount] = useState<number>(0);

  useEffect(() => {
    if (isAdminUser) {
      fetch("/api/admin/banners/pending?countOnly=true")
        .then((res) => (res.ok ? res.json() : { count: 0 }))
        .then((data) => {
          if (typeof data.count === "number") {
            setPendingBannerCount(data.count);
          }
        })
        .catch(() => setPendingBannerCount(0));

      fetch("/api/admin/appointments?countOnly=true")
        .then((res) => (res.ok ? res.json() : { pending: 0 }))
        .then((data) => {
          if (typeof data.pending === "number") {
            setPendingAppointmentCount(data.pending);
          }
        })
        .catch(() => setPendingAppointmentCount(0));
    }
  }, [isAdminUser, pathname]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6 text-xs text-slate-500 font-medium">
        Loading admin session...
      </div>
    );
  }

  const navContent = (
    <>
      <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-white">
        <Link
          href="/admin/categories"
          onClick={() => setMobileMenuOpen(false)}
          className="flex items-center shrink-0 py-1"
        >
          <img
            src="/namma-vaniga-logo.webp"
            alt="Namma Vanigam"
            className="h-10 w-auto object-contain scale-[1.02] origin-left"
          />
        </Link>
        <button
          onClick={() => setMobileMenuOpen(false)}
          className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:text-brand-navy hover:bg-slate-100"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        <div className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Directory Management
        </div>

        <Link
          href="/admin/businesses/pending"
          onClick={() => setMobileMenuOpen(false)}
          className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${
            pathname === "/admin/businesses/pending"
              ? "bg-brand-green text-white shadow-sm"
              : "text-slate-600 hover:text-brand-navy hover:bg-white"
          }`}
        >
          <Clock className="w-4 h-4 text-amber-500" />
          Pending Approvals
        </Link>

        <Link
          href="/admin/banners/pending"
          onClick={() => setMobileMenuOpen(false)}
          className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${
            pathname === "/admin/banners/pending"
              ? "bg-brand-green text-white shadow-sm"
              : "text-slate-600 hover:text-brand-navy hover:bg-white"
          }`}
        >
          <span className="flex items-center gap-3">
            <ImageIcon className="w-4 h-4 text-emerald-500" />
            Banner Approvals
          </span>
          {pendingBannerCount > 0 && (
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold shadow-2xs ${
                pathname === "/admin/banners/pending"
                  ? "bg-white text-brand-green"
                  : "bg-amber-500 text-white"
              }`}
            >
              {pendingBannerCount}
            </span>
          )}
        </Link>

        <Link
          href="/admin/appointments"
          onClick={() => setMobileMenuOpen(false)}
          className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${
            pathname?.startsWith("/admin/appointments")
              ? "bg-brand-green text-white shadow-sm"
              : "text-slate-600 hover:text-brand-navy hover:bg-white"
          }`}
        >
          <span className="flex items-center gap-3">
            <CalendarCheck className="w-4 h-4 text-[#1A8A2E]" />
            Appointments
          </span>
          {pendingAppointmentCount > 0 && (
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold shadow-2xs ${
                pathname?.startsWith("/admin/appointments")
                  ? "bg-white text-brand-green"
                  : "bg-amber-500 text-white"
              }`}
            >
              {pendingAppointmentCount}
            </span>
          )}
        </Link>

        <Link
          href="/admin/businesses"
          onClick={() => setMobileMenuOpen(false)}
          className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${
            pathname === "/admin/businesses"
              ? "bg-brand-green text-white shadow-sm"
              : "text-slate-600 hover:text-brand-navy hover:bg-white"
          }`}
        >
          <Building2 className="w-4 h-4" />
          All Businesses
        </Link>

        <Link
          href="/admin/categories"
          onClick={() => setMobileMenuOpen(false)}
          className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${
            pathname?.startsWith("/admin/categories")
              ? "bg-brand-green text-white shadow-sm"
              : "text-slate-600 hover:text-brand-navy hover:bg-white"
          }`}
        >
          <FolderTree className="w-4 h-4" />
          Categories
        </Link>

        <Link
          href="/admin/locations"
          onClick={() => setMobileMenuOpen(false)}
          className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${
            pathname?.startsWith("/admin/locations")
              ? "bg-brand-green text-white shadow-sm"
              : "text-slate-600 hover:text-brand-navy hover:bg-white"
          }`}
        >
          <MapPin className="w-4 h-4" />
          Locations
        </Link>

        <Link
          href="/admin/reviews/reported"
          onClick={() => setMobileMenuOpen(false)}
          className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${
            pathname?.startsWith("/admin/reviews/reported")
              ? "bg-brand-green text-white shadow-sm"
              : "text-slate-600 hover:text-brand-navy hover:bg-white"
          }`}
        >
          <Flag className="w-4 h-4 text-rose-500" />
          Reported Reviews
        </Link>
      </nav>

      {/* Real User Profile Footer */}
      <div className="p-4 border-t border-slate-200 bg-white space-y-3">
        {user ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-brand-green-light text-brand-green flex items-center justify-center font-bold text-xs">
                {user.name ? user.name.charAt(0).toUpperCase() : "A"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-brand-navy truncate">
                  {user.name || "Admin User"}
                </p>
                <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-brand-green-light text-brand-green text-[10px] font-bold uppercase tracking-wide border border-brand-green/20">
                Role: {user.role}
              </span>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  showLogoutToast();
                  signOut({ callbackUrl: "/admin/login" });
                }}
                className="flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-rose-600 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          <Link
            href="/admin/login"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center justify-center gap-2 w-full py-2 bg-brand-green hover:bg-brand-green-hover text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <User className="w-3.5 h-3.5" />
            Sign In
          </Link>
        )}
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-white overflow-hidden text-brand-navy">
      {/* Desktop Fixed Left Sidebar */}
      <aside className="hidden lg:flex w-64 bg-brand-card text-brand-navy flex-col border-r border-slate-200">
        {navContent}
      </aside>

      {/* Mobile/Tablet Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-200"
        />
      )}

      {/* Mobile/Tablet Slide-in Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 w-64 bg-brand-card text-brand-navy z-50 transform transition-transform duration-300 ease-in-out lg:hidden flex flex-col border-r border-slate-200 shadow-2xl ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {navContent}
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl border border-slate-200 text-slate-600 hover:text-brand-navy focus:outline-none transition-colors shrink-0"
              aria-label="Toggle admin navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <h1 className="text-sm sm:text-base font-bold text-brand-navy truncate">
              {pathname === "/admin/businesses/pending"
                ? "Pending Business Approvals"
                : pathname === "/admin/banners/pending"
                ? "Banner Approvals Queue"
                : pathname?.startsWith("/admin/appointments")
                ? "Appointment Requests"
                : pathname === "/admin/businesses"
                ? "All Businesses Management"
                : pathname?.includes("/categories")
                ? "Categories Management"
                : pathname?.includes("/reviews/reported")
                ? "Reported Reviews Moderation"
                : "Locations Management"}
            </h1>
            <span className="hidden sm:inline text-slate-300">|</span>
            <span className="hidden sm:inline text-xs text-slate-500 truncate">
              Namma Vanigam Directory Admin
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {isAdminUser ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-semibold bg-brand-green-light text-brand-green border border-brand-green/20">
                <ShieldCheck className="w-3.5 h-3.5 text-brand-green shrink-0" />
                <span className="hidden xs:inline">Access Granted:</span> role=admin
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span className="hidden xs:inline">Access Denied:</span> role={user?.role || "unauthenticated"}
              </span>
            )}
          </div>
        </header>

        {/* Body View */}
        <main className="flex-1 overflow-auto p-4 sm:p-6 bg-white">
          {isAdminUser ? (
            children
          ) : (
            <div className="max-w-md mx-auto my-8 sm:my-16 p-6 sm:p-8 bg-brand-card rounded-xl shadow-sm border border-slate-200 text-center">
              <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-600">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-brand-navy mb-2">403 Access Denied</h2>
              <p className="text-xs text-slate-600 mb-6">
                This administrative section requires an account with{" "}
                <code className="font-semibold text-brand-navy">role = admin</code>. Your
                current role is{" "}
                <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 text-rose-600 font-mono">
                  {user?.role || "none"}
                </code>
                .
              </p>
              <div className="flex items-center justify-center gap-3">
                <Link
                  href="/admin/login"
                  className="px-4 py-2 bg-brand-green hover:bg-brand-green-hover text-white font-semibold rounded-lg text-xs transition-colors shadow-sm"
                >
                  Sign in as Admin
                </Link>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

