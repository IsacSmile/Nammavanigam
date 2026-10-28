import Link from "next/link";
import { X } from "lucide-react";

export default function AuthHeader() {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo (Top-Left) */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0 py-1" aria-label="Go to homepage">
          <img
            src="/namma-vaniga-logo.webp"
            alt="Namma Vanigam"
            className="h-10 sm:h-12 w-auto object-contain scale-[1.02] origin-left"
          />
        </Link>

        {/* Close (X) Icon Button (Top-Right) */}
        <Link
          href="/"
          aria-label="Close and return to homepage"
          className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:text-brand-navy hover:bg-slate-50 transition-colors flex items-center justify-center"
        >
          <X className="w-5 h-5" />
        </Link>
      </div>
    </header>
  );
}


