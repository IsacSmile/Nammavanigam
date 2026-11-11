export interface PhotoLike {
  sortOrder: number;
  altText?: string | null;
  [key: string]: any;
}

/**
 * Returns true only when a photo has sortOrder === 0
 * AND its altText (trimmed) ends with the word "logo" (case-insensitive).
 */
export function isLogoPhoto(p: PhotoLike | null | undefined): boolean {
  if (!p || typeof p.sortOrder !== "number") return false;
  return p.sortOrder === 0 && /\blogo$/i.test((p.altText ?? "").trim());
}

/**
 * Splits a list of business photos into { logo, gallery }.
 * The gallery is ordered by sortOrder and excludes the logo row.
 * Any photo that does not satisfy both logo conditions always stays in the gallery.
 */
export function splitBusinessPhotos<T extends PhotoLike>(
  photos: T[] | null | undefined
): {
  logo: T | null;
  gallery: T[];
} {
  if (!photos || !Array.isArray(photos)) {
    return { logo: null, gallery: [] };
  }

  let logo: T | null = null;
  const gallery: T[] = [];

  for (const photo of photos) {
    if (isLogoPhoto(photo)) {
      if (!logo) {
        logo = photo;
      }
    } else {
      gallery.push(photo);
    }
  }

  // Gallery ordered by sortOrder
  gallery.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  return { logo, gallery };
}

