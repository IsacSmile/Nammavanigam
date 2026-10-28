const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Testing database persistence...");

  // 1. Create top-level category
  const category = await prisma.category.create({
    data: {
      name: "Test Restaurants",
      slug: "test-restaurants",
      iconUrl: "🍽️",
      description: "Dining and cafes in Kochi",
      status: "active",
      sortOrder: 1,
    },
  });
  console.log("✓ Created Category:", category);

  // 2. Create subcategory
  const subcategory = await prisma.category.create({
    data: {
      name: "Seafood & Grill",
      slug: "seafood-grill",
      parentId: category.id,
      status: "active",
      sortOrder: 1,
    },
  });
  console.log("✓ Created Subcategory:", subcategory);

  // 3. Create top-level location
  const location = await prisma.location.create({
    data: {
      name: "Kochi",
      slug: "kochi",
      latitude: 9.9312,
      longitude: 76.2673,
      status: "active",
      sortOrder: 1,
    },
  });
  console.log("✓ Created Location:", location);

  // 4. Create sub-locality
  const sublocality = await prisma.location.create({
    data: {
      name: "Edappally",
      slug: "edappally",
      parentId: location.id,
      latitude: 10.0261,
      longitude: 76.3125,
      status: "active",
      sortOrder: 1,
    },
  });
  console.log("✓ Created Sub-locality:", sublocality);

  // 5. Query persisted data
  const allCategories = await prisma.category.findMany({ include: { children: true } });
  const allLocations = await prisma.location.findMany({ include: { children: true } });

  console.log(`Persisted Total: ${allCategories.length} categories, ${allLocations.length} locations.`);
}

main()
  .catch((e) => {
    console.error("CRUD test failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
