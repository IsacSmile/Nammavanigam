"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { LayoutDashboard, Building2, ShieldCheck, User } from "lucide-react";
import Header from "@/components/Header";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const user = session?.user;

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-xs text-slate-500 font-medium">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-brand-navy flex flex-col font-sans">
      {/* Site-wide Header */}
      <Header />

      {/* Main Container */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-8">
        {/* Welcome Hero Banner */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-navy tracking-tight flex items-center gap-2.5">
              <LayoutDashboard className="w-7 h-7 text-[#1A8A2E]" />
              Welcome back, {user?.name || "Partner"}!
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Signed in as <strong className="text-brand-navy font-bold">{user?.email}</strong>
            </p>
          </div>

          {user?.role === "admin" && (
            <Link
              href="/admin/businesses/pending"
              className="px-5 py-2.5 bg-[#1A8A2E] hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors shadow-xs inline-flex items-center gap-2 shrink-0"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Go to Admin Control Panel</span>
            </Link>
          )}
        </div>

        {/* Dashboard Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: My Business Listings */}
          <div className="group bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-md hover:shadow-xl hover:border-brand-green/40 hover:-translate-y-0.5 transition-all flex flex-col justify-between space-y-5">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#EAF7EC] text-[#1A8A2E] border border-[#1A8A2E]/20 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                <Building2 className="w-6 h-6 stroke-[2.2]" />
              </div>
              <h3 className="font-extrabold text-brand-navy text-lg group-hover:text-[#1A8A2E] transition-colors">
                My Business Listings
              </h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                Create, view, and manage your local business listings, track approval status, and inspect submission feedback in Tamil Nadu.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
              <Link
                href="/my-businesses"
                className="px-4 py-2.5 bg-[#1A8A2E] hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors shadow-xs"
              >
                View My Businesses
              </Link>
              <Link
                href="/add-business"
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
              >
                + Add Business
              </Link>
            </div>
          </div>

          {/* Card 2: Account Settings */}
          <div className="group bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-md hover:shadow-xl hover:border-brand-green/40 hover:-translate-y-0.5 transition-all flex flex-col justify-between space-y-5">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#EAF7EC] text-[#1A8A2E] border border-[#1A8A2E]/20 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                <User className="w-6 h-6 stroke-[2.2]" />
              </div>
              <h3 className="font-extrabold text-brand-navy text-lg group-hover:text-[#1A8A2E] transition-colors">
                Account Settings
              </h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                View your registered account details and profile information.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100">
              <div className="text-xs text-slate-500 font-medium py-1">
                Registered Email: <strong className="text-brand-navy font-bold">{user?.email}</strong>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
