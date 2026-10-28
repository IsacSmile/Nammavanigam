-- Drop redundant plain B-tree indexes on slug columns (since @unique already creates unique indexes)
DROP INDEX IF EXISTS "categories_slug_idx";
DROP INDEX IF EXISTS "locations_slug_idx";
DROP INDEX IF EXISTS "businesses_slug_idx";
