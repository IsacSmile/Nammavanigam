"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Search } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectOptionGroup {
  label: string;
  options: SelectOption[];
}

interface CustomAdminSelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options?: SelectOption[];
  groups?: SelectOptionGroup[];
  placeholder?: string;
  searchable?: boolean;
}

export default function CustomAdminSelect({
  label,
  value,
  onChange,
  options,
  groups,
  placeholder = "Select option...",
  searchable = false,
}: CustomAdminSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const flatOptions = groups
    ? groups.flatMap((g) => g.options)
    : options || [];

  const selectedOption = flatOptions.find((opt) => String(opt.value) === String(value));
  const displayLabel = selectedOption ? selectedOption.label : placeholder;

  const query = searchQuery.trim().toLowerCase();

  const filteredOptions =
    !groups && searchable && query
      ? flatOptions.filter((opt) => opt.label.toLowerCase().includes(query))
      : flatOptions;

  const filteredGroups =
    groups && searchable && query
      ? groups
          .map((g) => ({
            ...g,
            options: g.options.filter(
              (opt) =>
                opt.label.toLowerCase().includes(query) ||
                g.label.toLowerCase().includes(query)
            ),
          }))
          .filter((g) => g.options.length > 0)
      : groups || [];

  const totalOptionsCount = groups
    ? filteredGroups.reduce((acc, g) => acc + g.options.length, 0)
    : filteredOptions.length;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={containerRef}>
      {label && <label className="block text-[11px] font-semibold text-slate-600 mb-1">{label}</label>}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3.5 py-2 bg-white border text-left rounded-lg text-xs font-semibold flex items-center justify-between transition-all cursor-pointer shadow-2xs ${
          isOpen
            ? "border-[#1A8A2E] ring-2 ring-[#1A8A2E]/20 text-brand-navy"
            : "border-slate-300 hover:border-slate-400 text-slate-800"
        }`}
      >
        <span className="truncate">{displayLabel}</span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-[#1A8A2E]" : ""
          }`}
        />
      </button>

      {/* Custom Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 max-h-64 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-150">
          {searchable && flatOptions.length > 6 && (
            <div className="px-2 pb-1.5 border-b border-slate-100 mb-1">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter options..."
                  className="w-full pl-8 pr-3 py-1 text-[11px] bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1A8A2E] focus:bg-white text-slate-800 font-medium"
                />
              </div>
            </div>
          )}

          <div className="px-1 space-y-0.5">
            {totalOptionsCount === 0 ? (
              <div className="px-3 py-2 text-[11px] text-slate-400 text-center font-medium">
                No matching options
              </div>
            ) : groups ? (
              filteredGroups.map((group) => (
                <div key={group.label} className="pt-2 first:pt-0">
                  <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/80 rounded mb-0.5">
                    {group.label}
                  </div>
                  <div className="space-y-0.5">
                    {group.options.map((opt) => {
                      const isSelected = String(opt.value) === String(value);
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            onChange(opt.value);
                            setIsOpen(false);
                            setSearchQuery("");
                          }}
                          className={`w-full text-left px-3 py-2 text-xs rounded-lg font-medium flex items-center justify-between transition-colors cursor-pointer ${
                            isSelected
                              ? "bg-[#EAF7EC] text-[#1A8A2E] font-bold"
                              : "text-slate-700 hover:bg-slate-50 hover:text-brand-navy"
                          }`}
                        >
                          <span className="truncate">{opt.label}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-[#1A8A2E] shrink-0 ml-1.5" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = String(opt.value) === String(value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                      setSearchQuery("");
                    }}
                    className={`w-full text-left px-3 py-2 text-xs rounded-lg font-medium flex items-center justify-between transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-[#EAF7EC] text-[#1A8A2E] font-bold"
                        : "text-slate-700 hover:bg-slate-50 hover:text-brand-navy"
                    }`}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#1A8A2E] shrink-0 ml-1.5" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
