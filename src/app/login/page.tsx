"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, getSession } from "next-auth/react";
import { Mail, Lock, AlertCircle, ArrowRight } from "lucide-react";
import { showLoginSuccessToast, showLoginErrorToast } from "@/lib/toast";
import AuthHeader from "@/components/AuthHeader";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const urlError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    urlError === "AccessDeniedAdminOnly"
      ? "Access Restricted: Only administrator accounts can access /admin routes."
      : urlError === "AccessDeniedBusinessOnly"
      ? "Access Restricted: Only business owners and admins can access dashboard and my-businesses routes."
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
        const errorMessage = result.error === "CredentialsSignin" ? "Invalid email or password" : result.error;
        setError(errorMessage);
        showLoginErrorToast(errorMessage);
        setLoading(false);
      } else {
        const session = await getSession();
        showLoginSuccessToast(session?.user?.name);
        router.push(callbackUrl);
        router.refresh();
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
            Email Address
          </label>
          <div className="relative">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green text-xs"
            />
            <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          </div>
        </div>

        <div>
          <label className="block font-bold text-brand-navy mb-1">
            Password
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
          className="w-full py-2.5 bg-brand-green hover:bg-brand-green-hover text-white font-semibold rounded-lg shadow-sm transition-colors text-xs flex items-center justify-center gap-2"
        >
          {loading ? (
            "Signing in..."
          ) : (
            <>
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="pt-4 border-t border-slate-200 text-center">
        <p className="text-xs text-slate-600">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-bold text-brand-blue hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-brand-navy flex flex-col">
      <AuthHeader />

      <div className="flex-1 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2 mb-6">
          <h2 className="text-2xl font-bold tracking-tight text-brand-navy">
            Sign in to your account
          </h2>
          <p className="text-xs text-slate-500">
            Enter your credentials to access the directory management portal
          </p>
        </div>

        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Loading sign in...</div>}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
