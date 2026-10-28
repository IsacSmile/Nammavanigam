import Link from "next/link";
import { Building2, MapPin, FolderTree, ArrowRight, Phone } from "lucide-react";

export interface FooterCategory {
  id: number;
  name: string;
  slug: string;
}

export interface FooterLocation {
  id: number;
  name: string;
  slug: string;
}

interface FooterProps {
  categories?: FooterCategory[];
  locations?: FooterLocation[];
}

export default function Footer({ categories = [], locations = [] }: FooterProps) {
  return (
    <footer className="bg-white text-slate-800 pt-16 pb-24 sm:pb-12 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Info (2 Columns) */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="inline-block">
              <img
                src="/namma-vaniga-logo.webp"
                alt="Namma Vanigam"
                className="h-10 sm:h-12 w-auto object-contain scale-[1.02] origin-left"
              />
            </Link>

            <p className="text-slate-600 text-xs leading-relaxed max-w-sm font-medium">
              Tamil Nadu&apos;s dedicated local business directory platform. Connecting customers with trusted local shops, healthcare providers, restaurants, and professionals across Tamil Nadu.
            </p>

            {/* Contact Details */}
            <div className="space-y-2 pt-1 text-xs text-slate-600 font-medium">
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#1A8A2E] shrink-0" />
                <div className="flex items-center gap-1.5 flex-wrap">
                  <a
                    href="tel:+919744774668"
                    className="hover:text-[#1A8A2E] transition-colors font-semibold text-slate-800"
                  >
                    +91 97447 74668
                  </a>
                  <a
                    href="https://wa.me/919744774668"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-500 hover:text-[#1A8A2E] transition-colors"
                  >
                    (Whats app & Call)
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-brand-blue shrink-0" />
                <span>Chennai, Tamil Nadu</span>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/add-business"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1A8A2E] hover:bg-[#147024] text-white font-bold text-xs transition-colors shadow-sm"
              >
                <span>Add Your Business Free</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Popular Categories */}
          <div className="space-y-3">
            <h3 className="font-bold text-[#000B4D] text-sm flex items-center gap-1.5 border-b border-slate-200 pb-2">
              <FolderTree className="w-4 h-4 text-[#1A8A2E]" />
              Categories
            </h3>
            {categories && categories.length > 0 ? (
              <ul className="space-y-2 text-xs text-slate-600 font-medium">
                {categories.slice(0, 7).map((cat) => (
                  <li key={cat.id}>
                    <Link
                      href={`/search?category=${cat.slug}`}
                      className="hover:text-[#1A8A2E] transition-colors"
                    >
                      {cat.name}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="space-y-2.5 pt-1 animate-pulse">
                <div className="h-3 bg-slate-200 rounded-md w-28" />
                <div className="h-3 bg-slate-200 rounded-md w-24" />
                <div className="h-3 bg-slate-200 rounded-md w-32" />
                <div className="h-3 bg-slate-200 rounded-md w-20" />
                <div className="h-3 bg-slate-200 rounded-md w-28" />
                <div className="h-3 bg-slate-200 rounded-md w-24" />
              </div>
            )}
          </div>

          {/* Top Locations */}
          <div className="space-y-3">
            <h3 className="font-bold text-[#000B4D] text-sm flex items-center gap-1.5 border-b border-slate-200 pb-2">
              <MapPin className="w-4 h-4 text-brand-blue" />
              Top Locations
            </h3>
            {locations && locations.length > 0 ? (
              <ul className="space-y-2 text-xs text-slate-600 font-medium">
                {locations.slice(0, 5).map((loc) => (
                  <li key={loc.id}>
                    <Link
                      href={`/location/${loc.slug}`}
                      className="hover:text-[#1A8A2E] transition-colors"
                    >
                      {loc.name}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="space-y-2.5 pt-1 animate-pulse">
                <div className="h-3 bg-slate-200 rounded-md w-24" />
                <div className="h-3 bg-slate-200 rounded-md w-28" />
                <div className="h-3 bg-slate-200 rounded-md w-20" />
                <div className="h-3 bg-slate-200 rounded-md w-32" />
                <div className="h-3 bg-slate-200 rounded-md w-24" />
                <div className="h-3 bg-slate-200 rounded-md w-28" />
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h3 className="font-bold text-[#000B4D] text-sm flex items-center gap-1.5 border-b border-slate-200 pb-2">
              <Building2 className="w-4 h-4 text-amber-500" />
              Directory
            </h3>
            <ul className="space-y-2 text-xs text-slate-600 font-medium">
              <li>
                <Link href="/add-business" className="hover:text-[#1A8A2E] transition-colors">
                  Add Your Business
                </Link>
              </li>
              <li>
                <Link href="/my-businesses" className="hover:text-[#1A8A2E] transition-colors">
                  My Businesses
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-[#1A8A2E] transition-colors">
                  Partner Dashboard
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Legal Placeholder Bar */}
        <div className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-medium">
          <p>© {new Date().getFullYear()} Namma Vanigam. All rights reserved.</p>

          <div className="flex items-center gap-6">
            <span className="hover:text-slate-900 cursor-pointer transition-colors">Privacy Policy</span>
            <span className="hover:text-slate-900 cursor-pointer transition-colors">Terms of Service</span>
            <span className="hover:text-slate-900 cursor-pointer transition-colors">Contact Support</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
