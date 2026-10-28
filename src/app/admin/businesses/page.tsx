"use client";

import { useState, useEffect } from "react";
import {
  Building2,
  FolderTree,
  MapPin,
  Star,
  Edit2,
  Filter,
  Search,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Mail,
  Phone,
  Globe,
  Navigation,
  FileText,
} from "lucide-react";
import CustomAdminSelect from "@/components/CustomAdminSelect";
import { getLocationSelectGroups } from "@/lib/location-options";

interface Category {
  id: number;
  name: string;
}

interface LocationItem {
  id: number;
  name: string;
  slug?: string;
  parentId?: number | null;
  parent?: { id: number; name: string; slug?: string } | null;
}

interface BusinessItem {
  id: number;
  name: string;
  slug: string;
  status: "pending" | "approved" | "rejected";
  rejectionReason: string | null;
  featured: boolean;
  showcaseOrder: number | null;
  verified: boolean;
  bannerUrl?: string | null;
  categoryId: number;
  locationId: number;
  description: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  createdAt: string;
  category: Category;
  location: LocationItem;
  owner: { id: number; name: string; email: string };
}

export default function AdminAllBusinessesPage() {
  const [businesses, setBusinesses] = useState<BusinessItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters State
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Edit Modal State
  const [editingBusiness, setEditingBusiness] = useState<BusinessItem | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    status: "approved",
    rejectionReason: "",
    featured: false,
    showcaseOrder: "",
    verified: false,
    categoryId: "",
    locationId: "",
    phone: "",
    email: "",
    website: "",
    address: "",
    description: "",
  });
  const [saving, setSaving] = useState(false);

  // Group locations into districts and child locations
  const districts = locations.filter((loc) => !loc.parentId);

  // Filter dropdown: districts (roll-up) and specific locations
  const locationFilterOptions = [
    { value: "all", label: "All Locations" },
    ...districts.flatMap((dist) => [
      { value: String(dist.id), label: `${dist.name} (District)` },
      ...locations
        .filter((loc) => loc.parentId === dist.id)
        .map((loc) => ({
          value: String(loc.id),
          label: `  — ${loc.name} (${dist.name})`,
        })),
    ]),
  ];

  // Edit modal: grouped locations with district entry first
  const locationSelectGroups = getLocationSelectGroups(locations);
  const locationEditGroups = locationSelectGroups.map((g) => ({
    label: g.districtName,
    options: g.options.map((opt) => ({
      value: opt.value,
      label: opt.label,
    })),
  }));

  // Fetch initial filters (Categories & Locations)
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [catRes, locRes] = await Promise.all([
          fetch("/api/admin/categories"),
          fetch("/api/admin/locations"),
        ]);
        if (catRes.ok) setCategories(await catRes.json());
        if (locRes.ok) setLocations(await locRes.json());
      } catch (err) {
        console.error("Failed to load categories/locations metadata:", err);
      }
    };
    fetchMetadata();
  }, []);

  // Fetch businesses list based on filters
  const fetchBusinesses = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (selectedStatus !== "all") params.append("status", selectedStatus);
      if (selectedCategory !== "all") params.append("categoryId", selectedCategory);
      if (selectedLocation !== "all") params.append("locationId", selectedLocation);
      if (searchQuery.trim()) params.append("search", searchQuery.trim());

      const res = await fetch(`/api/admin/businesses?${params.toString()}`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setBusinesses(data);
    } catch (err: any) {
      setError(err.message || "Failed to load businesses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinesses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStatus, selectedCategory, selectedLocation]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBusinesses();
  };

  // Update Showcase Order
  const handleUpdateShowcaseOrder = async (b: BusinessItem, orderVal: string) => {
    const parsed = orderVal.trim() === "" ? null : parseInt(orderVal, 10);
    const validParsed = parsed !== null && !isNaN(parsed) ? parsed : null;

    setBusinesses((prev) =>
      prev.map((item) => (item.id === b.id ? { ...item, showcaseOrder: validParsed } : item))
    );

    try {
      const res = await fetch(`/api/admin/businesses/${b.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ showcaseOrder: validParsed }),
      });

      if (!res.ok) {
        throw new Error("Failed to update showcase order");
      }
    } catch (err: any) {
      setError(err.message);
      fetchBusinesses();
    }
  };

  // Toggle Featured status instantaneously
  const handleToggleFeatured = async (b: BusinessItem) => {
    const newFeaturedState = !b.featured;
    setBusinesses((prev) =>
      prev.map((item) => (item.id === b.id ? { ...item, featured: newFeaturedState } : item))
    );

    try {
      const res = await fetch(`/api/admin/businesses/${b.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featured: newFeaturedState }),
      });

      if (!res.ok) {
        // Revert if failed
        setBusinesses((prev) =>
          prev.map((item) => (item.id === b.id ? { ...item, featured: b.featured } : item))
        );
        throw new Error("Failed to update featured status");
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Open Edit Modal
  const openEditModal = (b: BusinessItem) => {
    setEditingBusiness(b);
    setEditFormData({
      name: b.name,
      status: b.status,
      rejectionReason: b.rejectionReason || "",
      featured: b.featured,
      showcaseOrder: b.showcaseOrder !== null && b.showcaseOrder !== undefined ? String(b.showcaseOrder) : "",
      verified: b.verified,
      categoryId: String(b.categoryId),
      locationId: String(b.locationId),
      phone: b.phone || "",
      email: b.email || "",
      website: b.website || "",
      address: b.address || "",
      description: b.description || "",
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBusiness) return;
    setSaving(true);
    setError(null);

    try {
      const parsedOrder = editFormData.showcaseOrder.trim() === "" ? null : parseInt(editFormData.showcaseOrder, 10);
      const payload = {
        name: editFormData.name,
        status: editFormData.status,
        rejectionReason: editFormData.status === "rejected" ? editFormData.rejectionReason : null,
        featured: editFormData.featured,
        showcaseOrder: editFormData.featured && parsedOrder !== null && !isNaN(parsedOrder) ? parsedOrder : null,
        verified: editFormData.verified,
        categoryId: Number(editFormData.categoryId),
        locationId: Number(editFormData.locationId),
        phone: editFormData.phone,
        email: editFormData.email,
        website: editFormData.website,
        address: editFormData.address,
        description: editFormData.description,
      };

      const res = await fetch(`/api/admin/businesses/${editingBusiness.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to update business");
      }

      setEditingBusiness(null);
      await fetchBusinesses();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Banner Removal State & Handlers
  const [bannerRemovalBusiness, setBannerRemovalBusiness] = useState<BusinessItem | null>(null);
  const [bannerRemovalReason, setBannerRemovalReason] = useState("");
  const [submittingBannerRemoval, setSubmittingBannerRemoval] = useState(false);
  const [bannerRemovalError, setBannerRemovalError] = useState<string | null>(null);

  const openRemoveBannerModal = (business: BusinessItem) => {
    setBannerRemovalBusiness(business);
    setBannerRemovalReason("");
    setBannerRemovalError(null);
  };

  const handleRemoveBannerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerRemovalBusiness) return;
    if (!bannerRemovalReason.trim()) {
      setBannerRemovalError("Please provide a reason for banner removal.");
      return;
    }

    setSubmittingBannerRemoval(true);
    setBannerRemovalError(null);

    try {
      const res = await fetch(`/api/admin/banners/${bannerRemovalBusiness.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "remove",
          rejectionReason: bannerRemovalReason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to remove banner.");
      }

      setBannerRemovalBusiness(null);
      setBannerRemovalReason("");
      await fetchBusinesses();
    } catch (err: any) {
      setBannerRemovalError(err.message || "Failed to remove banner.");
    } finally {
      setSubmittingBannerRemoval(false);
    }
  };

  return (
    <div className="space-y-6 bg-white">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-brand-card p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-brand-navy flex items-center gap-2">
            <Building2 className="w-5 h-5 text-brand-green" />
            All Directory Businesses
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Filter, search, edit details, manage rejection reasons, and toggle featured status for all listed local businesses.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchBusinesses}
            className="p-2 text-slate-600 hover:text-brand-navy bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium transition-colors"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="font-bold">✕</button>
        </div>
      )}

      {/* Filter Controls Bar */}
      <div className="bg-slate-50 p-4 sm:p-5 rounded-xl border border-slate-200 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-brand-navy">
          <Filter className="w-4 h-4 text-brand-green" />
          Filter Businesses
        </div>

        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs items-end">
          {/* Status Filter */}
          <CustomAdminSelect
            label="Status"
            value={selectedStatus}
            onChange={(val) => setSelectedStatus(val)}
            options={[
              { value: "all", label: "All Statuses" },
              { value: "pending", label: "Pending" },
              { value: "approved", label: "Approved" },
              { value: "rejected", label: "Rejected" },
            ]}
          />

          {/* Category Filter */}
          <CustomAdminSelect
            label="Category"
            value={selectedCategory}
            onChange={(val) => setSelectedCategory(val)}
            options={[
              { value: "all", label: "All Categories" },
              ...categories.map((cat) => ({ value: String(cat.id), label: cat.name })),
            ]}
            searchable
          />

          {/* Location Filter */}
          <CustomAdminSelect
            label="Location"
            value={selectedLocation}
            onChange={(val) => setSelectedLocation(val)}
            options={locationFilterOptions}
            searchable
          />

          {/* Search Query */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Search</label>
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Name, email, phone..."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-green min-h-[40px]"
              />
              <button
                type="submit"
                className="px-3.5 py-2 bg-brand-green text-white font-semibold rounded-lg text-xs hover:bg-brand-green-hover transition-colors min-h-[40px] shrink-0 flex items-center justify-center"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Businesses Table & Cards */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm flex flex-col items-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-brand-green" />
            Loading directory businesses...
          </div>
        ) : businesses.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            No businesses match the selected filters.
          </div>
        ) : (
          <>
            {/* Desktop Table View (lg+) */}
            <table className="hidden lg:table w-full text-left text-xs border-collapse">
              <thead className="bg-brand-card text-brand-navy border-b border-slate-200 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 whitespace-nowrap">Business Name</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Status</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Category</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Location</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Owner Email</th>
                  <th className="py-3.5 px-4 text-center whitespace-nowrap">Featured</th>
                  <th className="py-3.5 px-4 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {businesses.map((b) => (
                  <tr key={b.id} className="hover:bg-brand-card transition-colors">
                    <td className="py-3.5 px-4 font-bold text-brand-navy whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-brand-green shrink-0" />
                        <div>
                          <p>{b.name}</p>
                          {b.rejectionReason && (
                            <p className="text-[10px] text-rose-600 font-normal italic truncate max-w-xs">
                              Reason: {b.rejectionReason}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {b.status === "approved" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Approved
                        </span>
                      ) : b.status === "rejected" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-semibold">
                          <XCircle className="w-3 h-3 text-rose-600" /> Rejected
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-semibold">
                          <Clock className="w-3 h-3 text-amber-600" /> Pending
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-700 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-brand-green-light text-brand-green font-semibold text-[11px] whitespace-nowrap">
                        <FolderTree className="w-3 h-3 shrink-0" />
                        {b.category?.name || "Uncategorized"}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-700 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-brand-blue-light text-brand-blue font-semibold text-[11px] whitespace-nowrap">
                        <MapPin className="w-3 h-3 shrink-0" />
                        {b.location?.parent?.name
                          ? `${b.location.name}, ${b.location.parent.name}`
                          : b.location?.name || "Unspecified"}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px] whitespace-nowrap">
                      {b.owner?.email || b.email || "N/A"}
                    </td>

                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleFeatured(b)}
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
                            b.featured
                              ? "bg-amber-100 text-amber-800 border border-amber-300 shadow-sm"
                              : "bg-slate-100 text-slate-400 hover:text-slate-600 border border-slate-200"
                          }`}
                          title="Click to toggle featured status"
                        >
                          <Star className={`w-3.5 h-3.5 ${b.featured ? "fill-amber-500 text-amber-500" : ""}`} />
                          {b.featured ? "Featured" : "Standard"}
                        </button>

                        {b.featured && (
                          <div
                            className="flex items-center gap-1 bg-amber-50 border border-amber-300 rounded-lg px-2 py-0.5"
                            title="Showcase Order (1-4 for hero grid)"
                          >
                            <span className="text-[10px] font-bold text-amber-800 shrink-0">Order:</span>
                            <input
                              type="number"
                              min="1"
                              max="99"
                              value={b.showcaseOrder ?? ""}
                              onChange={(e) => handleUpdateShowcaseOrder(b, e.target.value)}
                              placeholder="#"
                              className="w-10 px-1 py-0.5 text-center text-xs font-bold bg-white border border-amber-300 rounded text-amber-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                            />
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {b.bannerUrl && (
                          <button
                            onClick={() => openRemoveBannerModal(b)}
                            className="p-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors inline-flex items-center gap-1 text-xs font-medium"
                            title="Remove Banner"
                          >
                            Remove banner
                          </button>
                        )}
                        <button
                          onClick={() => openEditModal(b)}
                          className="p-1.5 text-slate-600 hover:text-brand-blue hover:bg-brand-blue-light rounded transition-colors inline-flex items-center gap-1 text-xs font-medium"
                          title="Edit Business"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile / Tablet Stacked Cards View (< lg) */}
            <div className="block lg:hidden divide-y divide-slate-200">
              {businesses.map((b) => (
                <div key={b.id} className="p-4 space-y-3 bg-white hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <Building2 className="w-5 h-5 text-brand-green shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <h4 className="font-bold text-brand-navy text-sm truncate">{b.name}</h4>
                        <p className="font-mono text-[11px] text-slate-500 truncate">{b.owner?.email || b.email || "No email"}</p>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {b.status === "approved" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Approved
                        </span>
                      ) : b.status === "rejected" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-semibold">
                          <XCircle className="w-3.5 h-3.5 text-rose-600" /> Rejected
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-semibold">
                          <Clock className="w-3.5 h-3.5 text-amber-600" /> Pending
                        </span>
                      )}
                    </div>
                  </div>

                  {b.rejectionReason && (
                    <div className="p-2 bg-rose-50 border border-rose-100 rounded text-[11px] text-rose-700">
                      <strong>Reason:</strong> {b.rejectionReason}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-brand-green-light text-brand-green font-semibold text-[11px]">
                      <FolderTree className="w-3 h-3" />
                      {b.category?.name || "Uncategorized"}
                    </span>

                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-brand-blue-light text-brand-blue font-semibold text-[11px]">
                      <MapPin className="w-3 h-3" />
                      {b.location?.parent?.name
                        ? `${b.location.name}, ${b.location.parent.name}`
                        : b.location?.name || "Unspecified"}
                    </span>
                  </div>

                  {/* Featured & Showcase Order Controls + Action */}
                  <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <button
                      onClick={() => handleToggleFeatured(b)}
                      className={`min-h-[44px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        b.featured
                          ? "bg-amber-100 text-amber-800 border border-amber-300 shadow-sm"
                          : "bg-white text-slate-500 hover:text-slate-700 border border-slate-200"
                      }`}
                      title="Click to toggle featured status"
                    >
                      <Star className={`w-4 h-4 ${b.featured ? "fill-amber-500 text-amber-500" : ""}`} />
                      {b.featured ? "Featured" : "Standard"}
                    </button>

                    {b.featured && (
                      <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-300 rounded-lg px-2.5 py-1.5 min-h-[44px]">
                        <span className="text-xs font-bold text-amber-800 shrink-0">Order:</span>
                        <input
                          type="number"
                          min="1"
                          max="99"
                          value={b.showcaseOrder ?? ""}
                          onChange={(e) => handleUpdateShowcaseOrder(b, e.target.value)}
                          placeholder="#"
                          className="w-12 px-2 py-1 text-center text-xs font-bold bg-white border border-amber-300 rounded text-amber-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                    )}

                    {b.bannerUrl && (
                      <button
                        onClick={() => openRemoveBannerModal(b)}
                        className="min-h-[44px] px-3.5 py-2 text-rose-600 bg-white border border-rose-200 hover:bg-rose-50 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ml-auto"
                        title="Remove Banner"
                      >
                        Remove banner
                      </button>
                    )}

                    <button
                      onClick={() => openEditModal(b)}
                      className={`min-h-[44px] min-w-[44px] px-3.5 py-2 text-slate-700 bg-white border border-slate-200 hover:bg-brand-blue-light hover:text-brand-blue rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                        b.bannerUrl ? "" : "ml-auto"
                      }`}
                      title="Edit Business"
                    >
                      <Edit2 className="w-4 h-4" />
                      <span>Edit</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Edit Modal Form */}
      {editingBusiness && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] flex flex-col rounded-xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-brand-card shrink-0">
              <h3 className="text-base font-bold text-brand-navy flex items-center gap-2 truncate">
                <Edit2 className="w-4 h-4 text-brand-green shrink-0" />
                <span className="truncate">Edit: {editingBusiness.name}</span>
              </h3>
              <button
                onClick={() => setEditingBusiness(null)}
                className="text-slate-400 hover:text-brand-navy font-bold text-lg p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-4 sm:p-6 space-y-4 text-xs overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-brand-navy mb-1">Business Name</label>
                  <input
                    type="text"
                    required
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green text-xs"
                  />
                </div>

                <CustomAdminSelect
                  label="Approval Status"
                  value={editFormData.status}
                  onChange={(val) => setEditFormData({ ...editFormData, status: val })}
                  options={[
                    { value: "pending", label: "Pending" },
                    { value: "approved", label: "Approved" },
                    { value: "rejected", label: "Rejected" },
                  ]}
                />
              </div>

              {/* Rejection Reason field if status is rejected */}
              {editFormData.status === "rejected" && (
                <div>
                  <label className="block font-bold text-rose-700 mb-1">Rejection Reason</label>
                  <textarea
                    rows={3}
                    value={editFormData.rejectionReason}
                    onChange={(e) => setEditFormData({ ...editFormData, rejectionReason: e.target.value })}
                    placeholder="Specify the reason why this business was rejected..."
                    className="w-full px-3 py-2 border border-rose-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 text-xs bg-rose-50/50"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <CustomAdminSelect
                  label="Category"
                  value={editFormData.categoryId}
                  onChange={(val) => setEditFormData({ ...editFormData, categoryId: val })}
                  options={categories.map((c) => ({ value: String(c.id), label: c.name }))}
                  searchable
                />

                <CustomAdminSelect
                  label="Location"
                  value={editFormData.locationId}
                  onChange={(val) => setEditFormData({ ...editFormData, locationId: val })}
                  groups={locationEditGroups}
                  placeholder="Select location"
                  searchable
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-brand-navy mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-brand-navy mb-1">Email</label>
                  <input
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="edit-featured"
                    checked={editFormData.featured}
                    onChange={(e) => setEditFormData({ ...editFormData, featured: e.target.checked })}
                    className="w-4 h-4 text-brand-green rounded border-slate-300 focus:ring-brand-green"
                  />
                  <label htmlFor="edit-featured" className="font-bold text-brand-navy cursor-pointer">
                    Featured Listing
                  </label>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="edit-verified"
                    checked={editFormData.verified}
                    onChange={(e) => setEditFormData({ ...editFormData, verified: e.target.checked })}
                    className="w-4 h-4 text-brand-green rounded border-slate-300 focus:ring-brand-green"
                  />
                  <label htmlFor="edit-verified" className="font-bold text-brand-navy cursor-pointer">
                    Verified Badge
                  </label>
                </div>
              </div>

              {editFormData.featured && (
                <div>
                  <label className="block font-bold text-amber-800 mb-1">
                    Showcase Order (1-4 for hero showcase grid)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    placeholder="e.g. 1 (Leave empty for default sorting)"
                    value={editFormData.showcaseOrder}
                    onChange={(e) => setEditFormData({ ...editFormData, showcaseOrder: e.target.value })}
                    className="w-full px-3 py-2 border border-amber-300 bg-amber-50/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs font-bold text-amber-900"
                  />
                </div>
              )}

              <div>
                <label className="block font-bold text-brand-navy mb-1">Address</label>
                <input
                  type="text"
                  value={editFormData.address}
                  onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-brand-navy mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green text-xs"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingBusiness(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-brand-green hover:bg-brand-green-hover text-white font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50 min-h-[44px]"
                >
                  {saving ? "Saving Changes..." : "Save Business"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Remove Banner Modal */}
      {bannerRemovalBusiness && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg flex flex-col rounded-xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-brand-card shrink-0">
              <h3 className="text-base font-bold text-brand-navy flex items-center gap-2 truncate">
                <span className="truncate">Remove Banner: {bannerRemovalBusiness.name}</span>
              </h3>
              <button
                onClick={() => setBannerRemovalBusiness(null)}
                className="text-slate-400 hover:text-brand-navy font-bold text-lg p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRemoveBannerSubmit} className="p-6 space-y-4 text-xs">
              {bannerRemovalError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 font-medium">
                  {bannerRemovalError}
                </div>
              )}

              <div>
                <label className="block font-bold text-brand-navy mb-1.5 text-xs">
                  Why is this banner being removed? <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={bannerRemovalReason}
                  onChange={(e) => setBannerRemovalReason(e.target.value)}
                  placeholder="Explain why this banner is being removed (e.g. copyright violation, poor quality, misleading image)..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setBannerRemovalBusiness(null)}
                  disabled={submittingBannerRemoval}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold hover:bg-slate-50 transition-colors min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingBannerRemoval || !bannerRemovalReason.trim()}
                  className="px-4 py-2 bg-rose-600 text-white rounded-lg font-semibold hover:bg-rose-700 disabled:opacity-50 transition-colors shadow-xs min-h-[44px]"
                >
                  {submittingBannerRemoval ? "Removing..." : "Remove banner"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
