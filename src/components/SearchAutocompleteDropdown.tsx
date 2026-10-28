"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Building2, FolderTree, Star, Loader2 } from "lucide-react";

export interface SearchSuggestionItem {
  type: "business" | "category";
  id: number | string;
  name: string;
  slug: string;
  categoryName?: string | null;
  locationName?: string | null;
  featured?: boolean;
}

export function useAutocomplete(query: string) {
  const [suggestions, setSuggestions] = useState<SearchSuggestionItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setIsLoading(false);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    setIsOpen(true);

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(trimmed)}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data);
        } else {
          setSuggestions([]);
        }
      } catch (err) {
        console.error("Autocomplete fetch error:", err);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  return { suggestions, isLoading, isOpen, setIsOpen };
}

interface DropdownProps {
  query: string;
  suggestions: SearchSuggestionItem[];
  isLoading: boolean;
  isOpen: boolean;
  onClose: () => void;
  onSelect?: () => void;
}

export default function SearchAutocompleteDropdown({
  query,
  suggestions,
  isLoading,
  isOpen,
  onClose,
  onSelect,
}: DropdownProps) {
  const router = useRouter();

  if (!isOpen || query.trim().length < 2) return null;

  const handleSelectBusiness = (slug: string) => {
    onClose();
    if (onSelect) onSelect();
    router.push(`/business/${slug}`);
  };

  const handleSelectCategory = (slug: string) => {
    onClose();
    if (onSelect) onSelect();
    router.push(`/search?category=${slug}`);
  };

  return (
    <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl border border-slate-200 shadow-2xl z-50 overflow-hidden text-left py-1 text-slate-800">
      {isLoading ? (
        <div className="p-4 flex items-center justify-center gap-2 text-xs font-semibold text-slate-500">
          <Loader2 className="w-4 h-4 animate-spin text-[#1A8A2E]" />
          <span>Searching directory...</span>
        </div>
      ) : suggestions.length === 0 ? (
        <div className="p-4 text-center text-xs font-medium text-slate-500">
          No matches found for &quot;{query.trim()}&quot;
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {suggestions.map((item) => {
            if (item.type === "category") {
              return (
                <div
                  key={`cat-${item.id}`}
                  onClick={() => handleSelectCategory(item.slug)}
                  className="px-4 py-3 hover:bg-emerald-50/60 cursor-pointer transition-colors flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 text-[#1A8A2E] flex items-center justify-center shrink-0">
                      <FolderTree className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-bold text-xs text-[#000B4D] group-hover:text-[#1A8A2E] transition-colors truncate">
                      Browse <span className="underline decoration-emerald-300 underline-offset-2">{item.name}</span>
                    </span>
                  </div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md shrink-0 ml-2">
                    Category
                  </span>
                </div>
              );
            }

            const subtitleParts = [item.categoryName, item.locationName].filter(Boolean);

            return (
              <div
                key={`biz-${item.id}`}
                onClick={() => handleSelectBusiness(item.slug)}
                className="px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors flex items-center justify-between gap-3 group"
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                    <Building2 className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <h4 className="font-bold text-xs text-[#000B4D] group-hover:text-[#1A8A2E] transition-colors truncate">
                      {item.name}
                    </h4>
                    {subtitleParts.length > 0 && (
                      <p className="text-[11px] text-slate-500 font-medium truncate">
                        {subtitleParts.join(" · ")}
                      </p>
                    )}
                  </div>
                </div>

                {item.featured && (
                  <span className="shrink-0 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-extrabold flex items-center gap-1">
                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> Featured
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
