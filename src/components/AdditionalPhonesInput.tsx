"use client";

import React from "react";
import { Phone, Plus, Trash2 } from "lucide-react";

export interface PhoneRow {
  number: string;
  label: string;
}

interface AdditionalPhonesInputProps {
  phones: PhoneRow[];
  onChange: (phones: PhoneRow[]) => void;
  errors?: { [index: number]: { number?: string; label?: string } };
}

export default function AdditionalPhonesInput({
  phones,
  onChange,
  errors = {},
}: AdditionalPhonesInputProps) {
  const handleAdd = () => {
    if (phones.length >= 4) return;
    onChange([...phones, { number: "", label: "" }]);
  };

  const handleRemove = (index: number) => {
    onChange(phones.filter((_, i) => i !== index));
  };

  const handleChange = (index: number, field: keyof PhoneRow, value: string) => {
    const updated = [...phones];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const isMaxReached = phones.length >= 4;

  return (
    <div className="space-y-3 sm:col-span-2 pt-2 border-t border-slate-200/70">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <div>
          <label className="block font-bold text-brand-navy text-xs">
            Additional phone numbers <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <p className="text-[11px] text-slate-500">
            Add direct lines, sales desks, or customer service contacts (up to 4).
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isMaxReached && (
            <span className="text-[11px] text-amber-600 font-medium">
              Maximum 4 numbers reached
            </span>
          )}
          <button
            type="button"
            onClick={handleAdd}
            disabled={isMaxReached}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              isMaxReached
                ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 cursor-pointer shadow-2xs"
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            + Add another number
          </button>
        </div>
      </div>

      {phones.length > 0 && (
        <div className="space-y-2.5">
          {phones.map((p, idx) => {
            const rowError = errors[idx];
            return (
              <div
                key={idx}
                className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-2"
              >
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                  <span>Additional Phone #{idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => handleRemove(idx)}
                    aria-label={`Remove additional phone ${idx + 1}`}
                    className="text-rose-600 hover:text-rose-800 text-xs flex items-center gap-1 font-medium transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Remove
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                  <div className="sm:col-span-7">
                    <div className="relative">
                      <input
                        type="tel"
                        inputMode="tel"
                        value={p.number}
                        onChange={(e) => handleChange(idx, "number", e.target.value)}
                        placeholder="+91 98470 12345"
                        className={`w-full pl-9 pr-3.5 py-2 bg-white border rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-green ${
                          rowError?.number ? "border-rose-400 bg-rose-50/30" : "border-slate-300"
                        }`}
                      />
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    </div>
                    {rowError?.number && (
                      <p className="text-[11px] text-rose-600 font-medium mt-1">
                        {rowError.number}
                      </p>
                    )}
                  </div>

                  <div className="sm:col-span-5">
                    <input
                      type="text"
                      maxLength={30}
                      value={p.label}
                      onChange={(e) => handleChange(idx, "label", e.target.value)}
                      placeholder="e.g. Sales, Support"
                      className={`w-full px-3 py-2 bg-white border rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-green ${
                        rowError?.label ? "border-rose-400 bg-rose-50/30" : "border-slate-300"
                      }`}
                    />
                    {rowError?.label && (
                      <p className="text-[11px] text-rose-600 font-medium mt-1">
                        {rowError.label}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
