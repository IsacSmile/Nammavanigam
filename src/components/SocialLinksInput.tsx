"use client";

import React from "react";
import { SOCIAL_PLATFORMS, PLATFORM_META, SocialPlatform } from "@/lib/contact";
import { SocialIcon } from "@/components/SocialIcon";

interface SocialLinksInputProps {
  values: Partial<Record<SocialPlatform, string>>;
  onChange: (platform: SocialPlatform, value: string) => void;
  errors?: Partial<Record<SocialPlatform, string>>;
}

export default function SocialLinksInput({
  values,
  onChange,
  errors = {},
}: SocialLinksInputProps) {
  return (
    <div className="space-y-3 sm:col-span-2 pt-3 border-t border-slate-200/70">
      <div>
        <label className="block font-bold text-brand-navy text-xs">
          Social media <span className="text-slate-400 font-normal">(optional)</span>
        </label>
        <p className="text-[11px] text-slate-500">
          Connect your business social profiles. Leave blank if not applicable.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        {SOCIAL_PLATFORMS.map((platform) => {
          const meta = PLATFORM_META[platform];
          const val = values[platform] || "";
          const errorMsg = errors[platform];

          return (
            <div key={platform} className="space-y-1">
              <label className="flex items-center gap-1.5 font-bold text-slate-700 text-xs">
                <span className="text-brand-navy">
                  <SocialIcon platform={platform} className="w-3.5 h-3.5 text-slate-600" />
                </span>
                <span>{meta.label}</span>
              </label>

              <div className="relative">
                <input
                  type="text"
                  value={val}
                  onChange={(e) => onChange(platform, e.target.value)}
                  placeholder={meta.placeholder}
                  className={`w-full pl-8 pr-3 py-2 bg-white border rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-green ${
                    errorMsg ? "border-rose-400 bg-rose-50/30" : "border-slate-300"
                  }`}
                />
                <span className="absolute left-2.5 top-2.5 text-slate-400">
                  <SocialIcon platform={platform} className="w-3.5 h-3.5" />
                </span>
              </div>

              {errorMsg && (
                <p className="text-[11px] text-rose-600 font-medium">{errorMsg}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
