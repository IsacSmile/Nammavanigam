"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Search,
  Plus,
  LogOut,
  LayoutDashboard,
  Building2,
  ShieldCheck,
  ChevronDown,
  Menu,
  X,
  FolderTree,
  LogIn,
  UserPlus,
} from "lucide-react";
import SearchAutocompleteDropdown, { useAutocomplete } from "./SearchAutocompleteDropdown";
import { showLogoutToast } from "@/lib/toast";

export default function Header() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const user = session?.user;

  const [headerSearch, setHeaderSearch] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const headerSearchRef = useRef<HTMLDivElement>(null);
  const { suggestions, isLoading, isOpen, setIsOpen } = useAutocomplete(headerSearch);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (headerSearchRef.current && !headerSearchRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setIsOpen]);

  const handleHeaderSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsOpen(false);
    if (headerSearch.trim()) {
      router.push(`/search?q=${encodeURIComponent(headerSearch.trim())}`);
    } else {
      router.push("/search");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0 py-1">
          <img
            src="/namma-vaniga-logo.webp"
            alt="Namma Vanigam"
            className="h-10 sm:h-12 w-auto object-contain scale-[1.02] origin-left"
          />
        </Link>

        {/* Compact Quick Search Bar (Hidden on Mobile) */}
        <div ref={headerSearchRef} className="hidden md:block flex-1 max-w-sm relative mx-2">
          <form
            onSubmit={handleHeaderSearch}
            className="flex items-center relative"
          >
            <input
              type="text"
              value={headerSearch}
              onChange={(e) => {
                setHeaderSearch(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => {
                if (headerSearch.trim().length >= 2) setIsOpen(true);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Search businesses in Tamil Nadu..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green focus:bg-white transition-all text-slate-900"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          </form>

          <SearchAutocompleteDropdown
            query={headerSearch}
            suggestions={suggestions}
            isLoading={isLoading}
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
          />
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center gap-2.5">
          {/* Browse Categories Link */}
          <Link
            href="/#popular-categories"
            className="hidden lg:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[#000B4D] hover:text-[#1A8A2E] hover:bg-slate-100/80 font-bold text-xs transition-all"
          >
            <FolderTree className="w-4 h-4 text-[#1A8A2E]" />
            <span>Browse Categories</span>
          </Link>

          {/* Add Your Business CTA Button (Desktop/Tablet) */}
          <Link
            href="/add-business"
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-green hover:bg-brand-green-hover text-white font-semibold text-xs sm:text-sm transition-colors shadow-2xs"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Your Business</span>
          </Link>

          {/* Desktop User Auth Menu / Avatar Dropdown (Hidden on Mobile < lg) */}
          <div className="hidden lg:block">
            {status === "loading" ? (
              <div className="flex items-center gap-2">
                <div className="w-16 h-8 rounded-xl bg-slate-100 animate-pulse" />
                <div className="w-20 h-8 rounded-xl bg-slate-200/80 animate-pulse" />
              </div>
            ) : user ? (
              /* Logged In User Dropdown */
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-white transition-all text-xs text-brand-navy font-bold focus:outline-none"
                >
                  <div className="w-7 h-7 rounded-lg bg-brand-green-light text-brand-green flex items-center justify-center font-extrabold text-xs">
                    {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                  </div>
                  <span className="max-w-[100px] truncate">{user.name}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {userDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setUserDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 text-xs font-medium space-y-1">
                      <div className="px-4 py-2 border-b border-slate-100 space-y-0.5">
                        <p className="font-bold text-brand-navy truncate">{user.name}</p>
                        <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                      </div>

                      {(user.role === "business_owner" || user.role === "admin") && (
                        <Link
                          href="/dashboard"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 hover:text-brand-navy transition-colors font-semibold"
                        >
                          <LayoutDashboard className="w-4 h-4 text-brand-green" />
                          Dashboard
                        </Link>
                      )}

                      {(user.role === "business_owner" || user.role === "admin") && (
                        <Link
                          href="/my-businesses"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 hover:text-brand-navy transition-colors font-semibold"
                        >
                          <Building2 className="w-4 h-4 text-brand-blue" />
                          My Businesses
                        </Link>
                      )}

                      {user.role === "admin" && (
                        <Link
                          href="/admin/businesses/pending"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 hover:text-brand-navy transition-colors font-semibold"
                        >
                          <ShieldCheck className="w-4 h-4 text-amber-500" />
                          Admin Panel
                        </Link>
                      )}

                      <div className="pt-1 border-t border-slate-100">
                        <button
                          onClick={() => {
                            setUserDropdownOpen(false);
                            showLogoutToast();
                            signOut({ callbackUrl: "/" });
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition-colors font-semibold text-left"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              /* Unauthenticated Login / Register Buttons */
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-3.5 py-2 rounded-xl text-slate-700 hover:text-brand-navy font-bold text-xs hover:bg-slate-100 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors shadow-xs"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl border border-slate-200 text-slate-600 hover:text-brand-navy focus:outline-none transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Backdrop Overlay with Fade Transition */}
      <div
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden="true"
        className={`fixed inset-0 top-16 bg-slate-900/30 backdrop-blur-[2px] z-30 lg:hidden transition-opacity duration-200 ease-out ${
          mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Mobile Unified Drawer Menu with Slide & Fade Transitions */}
      <div
        className={`absolute top-full left-0 right-0 bg-white border-b border-slate-200 p-4 space-y-4 shadow-xl z-40 lg:hidden transition-all duration-200 ease-out transform origin-top ${
          mobileMenuOpen
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 -translate-y-3 pointer-events-none"
        }`}
      >
        {/* 1. Search Bar */}
        <form
          onSubmit={(e) => {
            handleHeaderSearch(e);
            setMobileMenuOpen(false);
          }}
          className="relative"
        >
          <input
            type="text"
            value={headerSearch}
            onChange={(e) => setHeaderSearch(e.target.value)}
            placeholder="Search businesses in Tamil Nadu..."
            className="w-full pl-9 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green focus:bg-white text-slate-900"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
        </form>

        {/* 2. Browse Categories Link */}
        <div>
          <Link
            href="/#popular-categories"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl hover:bg-slate-100/80 text-xs font-bold text-[#000B4D] hover:text-[#1A8A2E] transition-colors"
          >
            <FolderTree className="w-4 h-4 text-[#1A8A2E]" />
            <span>Browse Categories</span>
          </Link>
        </div>

        {/* 3. Add Your Business Button */}
        <div>
          <Link
            href="/add-business"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-brand-green hover:bg-brand-green-hover text-white font-semibold text-xs sm:text-sm transition-colors shadow-2xs"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Your Business</span>
          </Link>
        </div>

        {/* 4. Divider */}
        <div className="border-t border-slate-200 pt-3" />

        {/* 5. User Auth Section */}
        {status === "loading" ? (
          <div className="p-3 bg-slate-50 rounded-xl animate-pulse flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-200 rounded-lg" />
            <div className="space-y-1 flex-1">
              <div className="w-24 h-3 bg-slate-200 rounded" />
              <div className="w-32 h-2.5 bg-slate-200 rounded" />
            </div>
          </div>
        ) : user ? (
          <div className="space-y-3">
            {/* Identity Header */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-brand-green-light text-brand-green flex items-center justify-center font-extrabold text-sm shrink-0">
                {user.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-xs text-brand-navy truncate">{user.name}</p>
                <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
              </div>
            </div>

            {/* User Menu Links */}
            <div className="space-y-1">
              {(user.role === "business_owner" || user.role === "admin") && (
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-brand-navy text-xs font-bold transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4 text-brand-green" />
                  <span>Dashboard</span>
                </Link>
              )}

              {(user.role === "business_owner" || user.role === "admin") && (
                <Link
                  href="/my-businesses"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-brand-navy text-xs font-bold transition-colors"
                >
                  <Building2 className="w-4 h-4 text-brand-blue" />
                  <span>My Businesses</span>
                </Link>
              )}

              {user.role === "admin" && (
                <Link
                  href="/admin/businesses/pending"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-brand-navy text-xs font-bold transition-colors"
                >
                  <ShieldCheck className="w-4 h-4 text-amber-500" />
                  <span>Admin Panel</span>
                </Link>
              )}

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  showLogoutToast();
                  signOut({ callbackUrl: "/" });
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-600 hover:bg-rose-50 hover:text-rose-600 text-xs font-bold transition-colors text-left"
              >
                <LogOut className="w-4 h-4 text-rose-500" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        ) : (
          /* Logged Out State */
          <div className="grid grid-cols-2 gap-2 pt-1">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-colors text-center"
            >
              <LogIn className="w-4 h-4 text-slate-500" />
              <span>Sign In</span>
            </Link>
            <Link
              href="/register"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors text-center shadow-xs"
            >
              <UserPlus className="w-4 h-4" />
              <span>Register</span>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

