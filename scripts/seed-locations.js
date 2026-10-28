const fs = require("fs");
const path = require("path");

function loadEnv() {
  const envPath = path.join(__dirname, "../.env");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}
loadEnv();

const { PrismaClient } = require("@prisma/client");

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("Error: DATABASE_URL environment variable is missing.");
  process.exit(1);
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: dbUrl,
    },
  },
});

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[\s\W-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const KOCHI_SUB_LOCALITIES = [
  "Fort Kochi",
  "Mattancherry",
  "Ernakulam",
  "Edappally",
  "Kakkanad",
  "Vyttila",
  "Palarivattom",
  "Kaloor",
  "Panampilly Nagar",
  "Marine Drive",
  "Thevara",
  "Thrikkakara",
  "Kadavanthra",
  "Elamkulam",
  "Thammanam",
  "Aluva",
  "Tripunithura",
  "Kalamassery",
];

const TEST_LOCATION_NAMES = [
  "Hydrabad",
  "Kerala",
  "TVM",
  "varkala",
];

async function main() {
  console.log("Starting Location Taxonomy Seeding...");

  // 1. Ensure Top-Level Location "Kochi" exists
  const kochiSlug = slugify("Kochi");
  let kochiLocation = await prisma.location.findFirst({
    where: {
      OR: [{ name: "Kochi" }, { slug: kochiSlug }],
      parentId: null,
    },
  });

  if (!kochiLocation) {
    kochiLocation = await prisma.location.create({
      data: {
        name: "Kochi",
        slug: kochiSlug,
        status: "active",
        sortOrder: 1,
      },
    });
    console.log(`✓ Created Primary Top-Level Location: "${kochiLocation.name}"`);
  } else {
    console.log(`- Primary Top-Level Location already exists: "${kochiLocation.name}"`);
  }

  // 2. Seed Sub-localities under Kochi
  let totalSubLocalities = 0;

  for (let i = 0; i < KOCHI_SUB_LOCALITIES.length; i++) {
    const subName = KOCHI_SUB_LOCALITIES[i];
    const subSlug = slugify(subName);

    let subLoc = await prisma.location.findFirst({
      where: {
        OR: [{ name: subName }, { slug: subSlug }],
      },
    });

    if (!subLoc) {
      subLoc = await prisma.location.create({
        data: {
          parentId: kochiLocation.id,
          name: subName,
          slug: subSlug,
          status: "active",
          sortOrder: i + 1,
        },
      });
      console.log(`  └─ Created Sub-locality: "${subLoc.name}" under "${kochiLocation.name}"`);
    } else {
      // Ensure parentId is set to Kochi if it was orphan or top-level before
      if (subLoc.parentId !== kochiLocation.id) {
        subLoc = await prisma.location.update({
          where: { id: subLoc.id },
          data: { parentId: kochiLocation.id },
        });
        console.log(`  └─ Updated parent of "${subLoc.name}" to "${kochiLocation.name}"`);
      } else {
        console.log(`  └─ Sub-locality already exists: "${subLoc.name}" under "${kochiLocation.name}"`);
      }
    }

    totalSubLocalities++;
  }

  // 3. Delete user-specified test locations after reassigning businesses
  const testLocations = await prisma.location.findMany({
    where: {
      name: { in: TEST_LOCATION_NAMES },
    },
  });

  const testLocationIds = testLocations.map((l) => l.id);

  if (testLocationIds.length > 0) {
    console.log("\nReassigning existing businesses from test locations to Kochi...");
    await prisma.business.updateMany({
      where: { locationId: { in: testLocationIds } },
      data: { locationId: kochiLocation.id },
    });
    console.log(`✓ Reassigned businesses to "${kochiLocation.name}"`);

    console.log("\nDeleting test locations as requested by user...");
    await prisma.location.deleteMany({
      where: { id: { in: testLocationIds } },
    });
    console.log("✓ Test locations deleted successfully!");
  }

  console.log("\n=========================================");
  console.log("LOCATION SEEDING COMPLETED SUCCESSFULLY!");
  console.log(`- Primary Location:  ${kochiLocation.name}`);
  console.log(`- Sub-localities:   ${totalSubLocalities}`);
  console.log("=========================================");
}

main()
  .catch((e) => {
    console.error("Location Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
