"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, GripVertical, CornerDownRight, MapPin, RefreshCw, CheckCircle2, XCircle, Navigation } from "lucide-react";
import CustomAdminSelect from "@/components/CustomAdminSelect";

interface LocationItem {
  id: number;
  parentId: number | null;
  name: string;
  slug: string;
  latitude: number | null;
  longitude: number | null;
  status: string;
  sortOrder: number;
  parent?: { id: number; name: string } | null;
  _count?: { children: number; businesses: number };
}

export default function AdminLocationsPage() {
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<LocationItem | null>(null);

  // Form Fields
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    parentId: "",
    latitude: "",
    longitude: "",
    status: "active",
    sortOrder: 0,
  });

  // Delete State
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Drag and Drop State
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const fetchLocations = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/locations");
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setLocations(data);
    } catch (err: any) {
      setError(err.message || "Failed to load locations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const openCreateModal = (parentLocId?: number) => {
    setEditingLocation(null);
    setFormData({
      name: "",
      slug: "",
      parentId: parentLocId ? String(parentLocId) : "",
      latitude: "",
      longitude: "",
      status: "active",
      sortOrder: locations.length > 0 ? Math.max(...locations.map((l) => l.sortOrder)) + 1 : 1,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (loc: LocationItem) => {
    setEditingLocation(loc);
    setFormData({
      name: loc.name,
      slug: loc.slug,
      parentId: loc.parentId ? String(loc.parentId) : "",
      latitude: loc.latitude !== null ? String(loc.latitude) : "",
      longitude: loc.longitude !== null ? String(loc.longitude) : "",
      status: loc.status,
      sortOrder: loc.sortOrder,
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      name: formData.name,
      slug: formData.slug,
      parentId: formData.parentId ? Number(formData.parentId) : null,
      latitude: formData.latitude !== "" ? Number(formData.latitude) : null,
      longitude: formData.longitude !== "" ? Number(formData.longitude) : null,
      status: formData.status,
      sortOrder: Number(formData.sortOrder),
    };

    try {
      const url = editingLocation
        ? `/api/admin/locations/${editingLocation.id}`
        : "/api/admin/locations";
      const method = editingLocation ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to save location");
      }

      setIsModalOpen(false);
      await fetchLocations();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/locations/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to delete location");
      }
      setDeletingId(null);
      await fetchLocations();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Drag and Drop Reordering Handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const updatedList = [...flattenedLocations];
    const draggedItem = updatedList[draggedIndex];
    updatedList.splice(draggedIndex, 1);
    updatedList.splice(index, 0, draggedItem);

    setDraggedIndex(index);
    setFlattenedLocations(updatedList);
  };

  const handleDragEnd = async () => {
    setDraggedIndex(null);

    const reorderedItems = flattenedLocations.map((item, idx) => ({
      id: item.id,
      sortOrder: idx + 1,
    }));

    try {
      await fetch("/api/admin/locations/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: reorderedItems }),
      });
    } catch (err) {
      console.error("Failed to persist reordering:", err);
    }
  };

  const [flattenedLocations, setFlattenedLocations] = useState<(LocationItem & { level: number })[]>([]);

  useEffect(() => {
    const tree: (LocationItem & { level: number })[] = [];

    const parents = locations.filter((l) => !l.parentId);
    parents.forEach((parent) => {
      tree.push({ ...parent, level: 0 });
      const children = locations.filter((l) => l.parentId === parent.id);
      children.forEach((child) => {
        tree.push({ ...child, level: 1 });
      });
    });

    const inTreeIds = new Set(tree.map((t) => t.id));
    locations.forEach((l) => {
      if (!inTreeIds.has(l.id)) {
        tree.push({ ...l, level: 0 });
      }
    });

    setFlattenedLocations(tree);
  }, [locations]);

  return (
    <div className="space-y-6 bg-white">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-brand-card p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-brand-navy flex items-center gap-2">
            <MapPin className="w-5 h-5 text-brand-green" />
            Districts & Taluks Management
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Create, edit, delete, reorder via drag & drop, and manage nested taluks (e.g. Kanayannur taluk under Ernakulam district).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchLocations}
            className="p-2 text-slate-600 hover:text-brand-navy bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium transition-colors"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => openCreateModal()}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand-green hover:bg-brand-green-hover text-white font-semibold text-xs rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Location
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="font-bold">✕</button>
        </div>
      )}

      {/* Table & Cards List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">Loading locations...</div>
        ) : flattenedLocations.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            No locations found. Click &quot;Add Location&quot; to create your first location.
          </div>
        ) : (
          <>
            {/* Desktop Table View (lg+) */}
            <table className="hidden lg:table w-full text-left text-xs border-collapse">
              <thead className="bg-brand-card text-brand-navy border-b border-slate-200 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 w-10 whitespace-nowrap">Reorder</th>
                  <th className="py-3 px-4 whitespace-nowrap">Location Name</th>
                  <th className="py-3 px-4 whitespace-nowrap">Slug</th>
                  <th className="py-3 px-4 whitespace-nowrap">Type / Parent</th>
                  <th className="py-3 px-4 whitespace-nowrap">Coordinates (Lat, Lng)</th>
                  <th className="py-3 px-4 whitespace-nowrap">Sort Order</th>
                  <th className="py-3 px-4 whitespace-nowrap">Status</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {flattenedLocations.map((loc, index) => (
                  <tr
                    key={loc.id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`hover:bg-brand-card transition-colors ${
                      draggedIndex === index ? "bg-brand-green-light/50 opacity-60" : ""
                    }`}
                  >
                    <td className="py-3 px-4 cursor-grab text-slate-400 hover:text-brand-navy whitespace-nowrap">
                      <GripVertical className="w-4 h-4" />
                    </td>

                    <td className="py-3 px-4 font-bold text-brand-navy whitespace-nowrap">
                      <div className="flex items-center gap-2" style={{ paddingLeft: `${loc.level * 24}px` }}>
                        {loc.level > 0 && <CornerDownRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                        <MapPin className="w-4 h-4 text-brand-green shrink-0" />
                        <span>{loc.name}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-slate-600 font-mono text-[11px] whitespace-nowrap">
                      {loc.slug}
                    </td>

                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      {loc.parentId ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-brand-blue-light text-brand-blue font-medium text-[11px] whitespace-nowrap">
                          Taluk of: <strong>{loc.parent?.name || `ID ${loc.parentId}`}</strong>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-brand-green-light text-brand-green font-semibold text-[11px] whitespace-nowrap">
                          District
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-slate-600 font-mono text-[11px] whitespace-nowrap">
                      {loc.latitude !== null && loc.longitude !== null ? (
                        <span className="inline-flex items-center gap-1 text-slate-700 whitespace-nowrap">
                          <Navigation className="w-3 h-3 text-brand-blue shrink-0" />
                          {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[10px]">Not set</span>
                      )}
                    </td>

                    <td className="py-3 px-4 font-mono font-medium text-brand-navy whitespace-nowrap">
                      {loc.sortOrder}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      {loc.status === "active" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-brand-green-light text-brand-green border border-brand-green/20 text-[11px] font-semibold whitespace-nowrap">
                          <CheckCircle2 className="w-3 h-3 text-brand-green shrink-0" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[11px] font-medium whitespace-nowrap">
                          <XCircle className="w-3 h-3 text-slate-400 shrink-0" /> Inactive
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                        {!loc.parentId && (
                          <button
                            onClick={() => openCreateModal(loc.id)}
                            className="px-2 py-1 bg-brand-blue-light hover:bg-brand-blue hover:text-white text-brand-blue rounded text-[11px] font-semibold transition-colors"
                            title="Add Taluk"
                          >
                            + Taluk
                          </button>
                        )}
                        <button
                          onClick={() => openEditModal(loc)}
                          className="p-1.5 text-slate-600 hover:text-brand-blue hover:bg-brand-blue-light rounded transition-colors"
                          title="Edit Location"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingId(loc.id)}
                          className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                          title="Delete Location"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile / Tablet Stacked Cards View (< lg) */}
            <div className="block lg:hidden divide-y divide-slate-200">
              {flattenedLocations.map((loc) => (
                <div key={loc.id} className="p-4 space-y-3 bg-white hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0" style={{ paddingLeft: `${Math.min(loc.level * 16, 32)}px` }}>
                      {loc.level > 0 && <CornerDownRight className="w-4 h-4 text-slate-400 shrink-0" />}
                      <MapPin className="w-4.5 h-4.5 text-brand-green shrink-0" />
                      <div className="min-w-0">
                        <h4 className="font-bold text-brand-navy text-sm truncate">{loc.name}</h4>
                        <p className="font-mono text-[11px] text-slate-500 truncate">slug: {loc.slug}</p>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {loc.status === "active" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-brand-green-light text-brand-green border border-brand-green/20 text-[11px] font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-brand-green" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[11px] font-medium">
                          <XCircle className="w-3.5 h-3.5 text-slate-400" /> Inactive
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-slate-600">
                    <div>
                      {loc.parentId ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-brand-blue-light text-brand-blue font-medium text-[11px]">
                          Taluk of: <strong>{loc.parent?.name || `ID ${loc.parentId}`}</strong>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-brand-green-light text-brand-green font-semibold text-[11px]">
                          District
                        </span>
                      )}
                    </div>

                    {loc.latitude !== null && loc.longitude !== null && (
                      <div className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-600">
                        <Navigation className="w-3 h-3 text-brand-blue" />
                        {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}
                      </div>
                    )}
                  </div>

                  <div className="text-[11px] font-mono text-slate-500">
                    Order: <span className="font-bold text-brand-navy">{loc.sortOrder}</span>
                  </div>

                  {/* Touch-friendly Action Buttons (min 44px target) */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    {!loc.parentId && (
                      <button
                        onClick={() => openCreateModal(loc.id)}
                        className="min-h-[44px] px-3.5 py-2 bg-brand-blue-light hover:bg-brand-blue hover:text-white text-brand-blue rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        + Taluk
                      </button>
                    )}
                    <button
                      onClick={() => openEditModal(loc)}
                      className="min-h-[44px] min-w-[44px] px-3.5 py-2 text-slate-700 bg-slate-100 hover:bg-brand-blue-light hover:text-brand-blue rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                      title="Edit Location"
                    >
                      <Edit2 className="w-4 h-4" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => setDeletingId(loc.id)}
                      className="min-h-[44px] min-w-[44px] px-3.5 py-2 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                      title="Delete Location"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modal Form: Create / Edit Location */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg max-h-[90vh] flex flex-col rounded-xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-brand-card shrink-0">
              <h3 className="text-base font-bold text-brand-navy">
                {editingLocation ? "Edit Location" : "Create New Location"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-brand-navy font-bold text-lg p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-4 sm:p-6 space-y-4 text-xs overflow-y-auto flex-1">
              <div>
                <label className="block font-bold text-brand-navy mb-1">
                  Location Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Kanayannur taluk under Ernakulam district..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-brand-navy mb-1">
                  Slug (URL Segment)
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="auto-generated-if-empty"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green text-xs font-mono"
                />
              </div>

              <CustomAdminSelect
                label="Parent District (For Taluks)"
                value={formData.parentId}
                onChange={(val) => setFormData({ ...formData, parentId: val })}
                options={[
                  { value: "", label: "-- District (No Parent) --" },
                  ...locations
                    .filter((l) => !l.parentId && l.id !== editingLocation?.id)
                    .map((parentLoc) => ({ value: String(parentLoc.id), label: parentLoc.name })),
                ]}
                searchable
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-brand-navy mb-1">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    placeholder="e.g. 9.9312"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-brand-navy mb-1">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    placeholder="e.g. 76.2673"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-brand-navy mb-1">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green text-xs font-mono"
                  />
                </div>

                <CustomAdminSelect
                  label="Status"
                  value={formData.status}
                  onChange={(val) => setFormData({ ...formData, status: val })}
                  options={[
                    { value: "active", label: "Active" },
                    { value: "inactive", label: "Inactive" },
                  ]}
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-brand-green hover:bg-brand-green-hover text-white font-semibold rounded-lg shadow-sm transition-colors min-h-[44px]"
                >
                  {saving ? "Saving..." : editingLocation ? "Update Location" : "Create Location"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-xl shadow-xl border border-slate-200 p-6 text-center">
            <h3 className="text-lg font-bold text-brand-navy mb-2">Delete Location?</h3>
            <p className="text-xs text-slate-600 mb-6">
              Are you sure you want to delete this location? Taluks will automatically become primary district locations.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium text-xs hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deletingId)}
                disabled={saving}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-lg shadow-sm"
              >
                {saving ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
