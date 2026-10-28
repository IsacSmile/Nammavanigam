-- AlterTable / Migration for existing databases:
-- 1. Create UserStatus Enum
CREATE TYPE "UserStatus" AS ENUM ('active', 'suspended');

-- 2. Convert users.status from TEXT to UserStatus enum without data loss
ALTER TABLE "users" 
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE "UserStatus" USING (
    CASE 
      WHEN "status" = 'suspended' THEN 'suspended'::"UserStatus"
      ELSE 'active'::"UserStatus"
    END
  ),
  ALTER COLUMN "status" SET DEFAULT 'active'::"UserStatus";

-- 3. Update Business owner FK constraint from CASCADE to RESTRICT
ALTER TABLE "businesses" DROP CONSTRAINT IF EXISTS "businesses_owner_id_fkey";

ALTER TABLE "businesses" ADD CONSTRAINT "businesses_owner_id_fkey" 
  FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 4. Add index on Business status
CREATE INDEX IF NOT EXISTS "businesses_status_idx" ON "businesses"("status");
