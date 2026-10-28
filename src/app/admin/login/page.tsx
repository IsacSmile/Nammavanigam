"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, signOut, getSession, useSession } from "next-auth/react";
import { ShieldCheck, Mail, Lock, AlertCircle, ArrowRight, ShieldAlert } from "lucide-react";
import { showLoginSuccessToast, showLoginErrorToast } from "@/lib/toast";
import AuthHeader from "@/components/AuthHeader";

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/admin/categories";
  const urlError = searchParams.get("error");
  const { data: session, status } = useSession();

  useEffect(() => {
    // Automatically purge non-admin sessions if on /admin/login to prevent limbo state
    if (status === "authenticated" && session?.user?.role !== "admin") {
      signOut({ redirect: false });
    }
  }, [status, session]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    urlError === "AccessDeniedAdminOnly"
      ? "Access Denied: Only administrator accounts can access /admin routes."
      : urlError === "AccessDeniedBusinessOnly"
      ? "Access Denied: Only business owners and admins can access this area."
      : urlError
      ? `Access Error: ${urlError}`
      : null
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        const errorMsg = result.error === "CredentialsSignin" ? "Invalid email or password" : result.error;
        setError(errorMsg);
        showLoginErrorToast(errorMsg);
        setLoading(false);
      } else {
        // Fetch current session to verify role is admin
        const currentSession = await getSession();
        if (currentSession?.user?.role !== "admin") {
          await signOut({ redirect: false });
          const accessDeniedMsg = "Access Denied: Only administrator accounts can access /admin routes.";
          setError(accessDeniedMsg);
          showLoginErrorToast(accessDeniedMsg);
          setLoading(false);
        } else {
          showLoginSuccessToast(currentSession?.user?.name);
          router.push(callbackUrl);
          router.refresh();
        }
      }
    } catch (err: any) {
      const errMsg = err.message || "An unexpected error occurred. Please try again.";
      setError(errMsg);
      showLoginErrorToast(errMsg);
      setLoading(false);
    }
  };

  return (
    <div className="bg-brand-card py-8 px-6 shadow-sm border border-slate-200 rounded-xl sm:px-10 space-y-6">
      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block font-bold text-brand-navy mb-1">
            Admin Email Address
          </label>
          <div className="relative">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@nammavanigam.online"
              className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green text-xs"
            />
            <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          </div>
        </div>

        <div>
          <label className="block font-bold text-brand-navy mb-1">
            Admin Password
          </label>
          <div className="relative">
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green text-xs"
            />
            <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 min-h-[44px] bg-brand-green hover:bg-brand-green-hover text-white font-semibold rounded-lg shadow-sm transition-colors text-xs flex items-center justify-center gap-2"
        >
          {loading ? (
            "Authenticating Admin..."
          ) : (
            <>
              <span>Sign In to Admin Portal</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="pt-4 border-t border-slate-200 text-center">
        <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
          <span>Admin accounts are managed via system CLI seed scripts. Public registration is disabled.</span>
        </p>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-brand-navy flex flex-col">
      <AuthHeader />

      <div className="flex-1 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3 mb-6">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-green-light text-brand-green border border-brand-green/20">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-green" />
              Admin Portal Access
            </span>
          </div>

          <h2 className="text-xl font-bold tracking-tight text-brand-navy">
            Sign in to Admin Control Panel
          </h2>
          <p className="text-xs text-slate-500">
            Administrator authentication required for categories and locations management
          </p>
        </div>

        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Loading admin login...</div>}>
            <AdminLoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
