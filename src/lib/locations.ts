import { prisma } from "@/lib/prisma";

export interface TalukWithCount {
  id: number;
  name: string;
  slug: string;
  parentId: number | null;
  sortOrder: number;
  count: number;
  districtName?: string;
  districtSlug?: string;
}

export interface DistrictWithTaluks {
  id: number;
  name: string;
  slug: string;
  parentId: null;
  sortOrder: number;
  count: number;
  taluks: TalukWithCount[];
}

export interface ResolvedLocation {
  isDistrict: boolean;
  location: {
    id: number;
    name: string;
    slug: string;
    parentId: number | null;
  };
  district: {
    id: number;
    name: string;
    slug: string;
  };
  taluk: {
    id: number;
    name: string;
    slug: string;
  } | null;
  locationIds: number[];
}

/**
 * Loads all active districts with their active taluks, ordered by sortOrder asc.
 */
export async function getDistrictsWithTaluks() {
  const districts = await prisma.location.findMany({
    where: { parentId: null, status: "active" },
    orderBy: { sortOrder: "asc" },
    include: {
      children: {
        where: { status: "active" },
        orderBy: { sortOrder: "asc" },
      },
    },
  });
  return districts;
}

/**
 * Calculates approved listing counts grouped by locationId.
 * Returns directCounts (listings directly on that location id) and
 * rollupCounts (for taluk = direct; for district = sum of district direct + all taluk direct counts).
 */
export async function getLocationListingCounts(): Promise<{
  directCounts: Map<number, number>;
  rollupCounts: Map<number, number>;
}> {
  const counts = await prisma.business.groupBy({
    by: ["locationId"],
    where: { status: "approved" },
    _count: { id: true },
  });

  const directCounts = new Map<number, number>();
  for (const c of counts) {
    directCounts.set(c.locationId, c._count.id);
  }

  // Fetch hierarchy to roll up taluk counts into districts
  const districts = await getDistrictsWithTaluks();
  const rollupCounts = new Map<number, number>();

  for (const dist of districts) {
    let distTotal = directCounts.get(dist.id) || 0;
    for (const taluk of dist.children) {
      const talukCount = directCounts.get(taluk.id) || 0;
      rollupCounts.set(taluk.id, talukCount);
      distTotal += talukCount;
    }
    rollupCounts.set(dist.id, distTotal);
  }

  return { directCounts, rollupCounts };
}

/**
 * Returns all districts with their taluks and corresponding listing counts:
 * - District count = rollup count (district + all taluks)
 * - Taluk count = direct count
 */
export async function getDistrictsWithCounts(): Promise<DistrictWithTaluks[]> {
  const [districts, { directCounts, rollupCounts }] = await Promise.all([
    getDistrictsWithTaluks(),
    getLocationListingCounts(),
  ]);

  return districts.map((dist) => ({
    id: dist.id,
    name: dist.name,
    slug: dist.slug,
    parentId: null,
    sortOrder: dist.sortOrder,
    count: rollupCounts.get(dist.id) || 0,
    taluks: dist.children.map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      parentId: t.parentId,
      sortOrder: t.sortOrder,
      count: directCounts.get(t.id) || 0,
      districtName: dist.name,
      districtSlug: dist.slug,
    })),
  }));
}

/**
 * Returns the top districts by approved listing rollup count (highest first),
 * ties broken by sortOrder ascending.
 */
export async function getTopDistricts(limit = 5): Promise<DistrictWithTaluks[]> {
  const districts = await getDistrictsWithCounts();
  return districts
    .sort((a, b) => b.count - a.count || a.sortOrder - b.sortOrder)
    .slice(0, limit);
}

/**
 * Resolves a location slug:
 * - If district: covers itself and all its active taluks
 * - If taluk: covers itself
 * Returns null if location is not found or inactive.
 */
export async function resolveLocationSlug(slug: string): Promise<ResolvedLocation | null> {
  if (!slug || !slug.trim()) return null;

  const location = await prisma.location.findUnique({
    where: { slug: slug.trim(), status: "active" },
    include: {
      parent: {
        select: { id: true, name: true, slug: true },
      },
      children: {
        where: { status: "active" },
        select: { id: true, name: true, slug: true },
      },
    },
  });

  if (!location) return null;

  if (location.parentId === null) {
    // It is a district
    const childIds = location.children.map((c) => c.id);
    return {
      isDistrict: true,
      location: {
        id: location.id,
        name: location.name,
        slug: location.slug,
        parentId: null,
      },
      district: {
        id: location.id,
        name: location.name,
        slug: location.slug,
      },
      taluk: null,
      locationIds: [location.id, ...childIds],
    };
  } else {
    // It is a taluk
    return {
      isDistrict: false,
      location: {
        id: location.id,
        name: location.name,
        slug: location.slug,
        parentId: location.parentId,
      },
      district: location.parent || {
        id: location.parentId,
        name: "Tamil Nadu",
        slug: "tamil-nadu",
      },
      taluk: {
        id: location.id,
        name: location.name,
        slug: location.slug,
      },
      locationIds: [location.id],
    };
  }
}

/**
 * Returns the top (up to 4) (category, district) pairs among approved listings.
 */
export async function getTopCategoryDistrictPairs(limit = 4) {
  const listings = await prisma.business.findMany({
    where: { status: "approved" },
    select: {
      id: true,
      category: {
        select: { id: true, name: true, slug: true },
      },
      location: {
        select: {
          id: true,
          name: true,
          slug: true,
          parent: { select: { id: true, name: true, slug: true } },
        },
      },
    },
  });

  const pairCounts = new Map<
    string,
    {
      categoryName: string;
      categorySlug: string;
      districtName: string;
      districtSlug: string;
      count: number;
    }
  >();

  for (const b of listings) {
    if (!b.category || !b.location) continue;
    const dist = b.location.parent || b.location;
    const key = `${b.category.slug}:${dist.slug}`;

    const existing = pairCounts.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      pairCounts.set(key, {
        categoryName: b.category.name,
        categorySlug: b.category.slug,
        districtName: dist.name,
        districtSlug: dist.slug,
        count: 1,
      });
    }
  }

  const sorted = Array.from(pairCounts.values()).sort(
    (a, b) => b.count - a.count || a.categoryName.localeCompare(b.categoryName)
  );

  return sorted.slice(0, limit).map((p) => ({
    label: `${p.categoryName} ${p.districtName}`,
    categorySlug: p.categorySlug,
    districtSlug: p.districtSlug,
    count: p.count,
  }));
}
