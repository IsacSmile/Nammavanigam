/**
 * Helper types and utilities for rendering grouped location dropdowns
 * across public, owner-facing, and admin forms.
 */

export interface RawLocationItem {
  id: number;
  name: string;
  slug?: string;
  parentId?: number | null;
  sortOrder?: number;
}

export interface LocationSelectOption {
  value: string;
  label: string;
  isDistrict: boolean;
}

export interface LocationSelectGroup {
  districtId: number;
  districtName: string;
  sortOrder: number;
  options: LocationSelectOption[];
}

/**
 * Builds standard grouped location options:
 * - One group per district, sorted by sortOrder ascending (south to north).
 * - In each group, the FIRST option is the district itself: "{District} (District)".
 * - Followed by its taluks sorted by sortOrder ascending, labeled with the taluk name only.
 * - Value is the location ID string in both cases.
 */
export function getLocationSelectGroups<T extends RawLocationItem>(
  locations: T[]
): LocationSelectGroup[] {
  const districts = locations
    .filter((loc) => !loc.parentId)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  return districts.map((dist) => {
    const taluks = locations
      .filter((loc) => loc.parentId === dist.id)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

    return {
      districtId: dist.id,
      districtName: dist.name,
      sortOrder: dist.sortOrder ?? 0,
      options: [
        {
          value: String(dist.id),
          label: `${dist.name} (District)`,
          isDistrict: true,
        },
        ...taluks.map((t) => ({
          value: String(t.id),
          label: t.name,
          isDistrict: false,
        })),
      ],
    };
  });
}

/**
 * Formats a location for display:
 * - Taluk listing (has parent): "{Taluk}, {District}"
 * - District listing (no parent): "{District}"
 */
export function formatLocationDisplay(
  location?: { name?: string | null; parent?: { name?: string | null } | null } | null
): string {
  if (!location || !location.name) return "";
  if (location.parent && location.parent.name) {
    return `${location.name}, ${location.parent.name}`;
  }
  return location.name;
}
