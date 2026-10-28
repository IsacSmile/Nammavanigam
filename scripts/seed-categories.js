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

const TAXONOMY = [
  {
    name: "Food & Dining",
    icon: "UtensilsCrossed",
    subcategories: [
      "Restaurants",
      "Cafes & Coffee Shops",
      "Bakeries",
      "Fast Food",
      "Catering",
      "Cloud Kitchens",
      "Desserts & Ice Cream",
      "Bars & Pubs",
    ],
  },
  {
    name: "Hotels, Travel & Tourism",
    icon: "Hotel",
    subcategories: [
      "Hotels",
      "Resorts",
      "Homestays",
      "Travel Agencies",
      "Tour Operators",
      "Car Rentals",
      "Taxi & Cab Services",
      "Tourist Attractions",
    ],
  },
  {
    name: "Healthcare",
    icon: "Stethoscope",
    subcategories: [
      "Hospitals",
      "Clinics",
      "Doctors",
      "Dental Clinics",
      "Pharmacies",
      "Diagnostic Centres",
      "Physiotherapy",
      "Mental Wellness",
    ],
  },
  {
    name: "Education",
    icon: "GraduationCap",
    subcategories: [
      "Schools",
      "Colleges",
      "Tuition Centres",
      "Coaching Centres",
      "Competitive Exam Coaching",
      "Online Classes",
      "Training Institutes",
      "Preschools",
    ],
  },
  {
    name: "Home & Property",
    icon: "Home",
    subcategories: [
      "Real Estate",
      "Builders & Developers",
      "Interior Designers",
      "Architects",
      "Home Decor",
      "Furniture",
      "Home Appliances",
      "Pest Control",
      "Cleaning Services",
    ],
  },
  {
    name: "Automotive",
    icon: "Car",
    subcategories: [
      "Car Dealers",
      "Used Cars",
      "Bike Dealers",
      "Auto Service",
      "Car Wash",
      "Tyre Shops",
      "Spare Parts",
      "Driving Schools",
    ],
  },
  {
    name: "Beauty & Wellness",
    icon: "Sparkles",
    subcategories: [
      "Salons",
      "Beauty Parlours",
      "Spas",
      "Skin Clinics",
      "Hair Studios",
      "Fitness Centres",
      "Yoga",
      "Bridal Makeup",
    ],
  },
  {
    name: "Shopping & Retail",
    icon: "ShoppingBag",
    subcategories: [
      "Supermarkets",
      "Fashion",
      "Jewellery",
      "Electronics",
      "Mobile Shops",
      "Grocery",
      "Footwear",
      "Gift Shops",
    ],
  },
  {
    name: "Professional Services",
    icon: "Briefcase",
    subcategories: [
      "Lawyers",
      "Chartered Accountants",
      "Insurance",
      "Consultants",
      "Digital Marketing",
      "Web Design",
      "Graphic Design",
      "Printing",
    ],
  },
  {
    name: "Events & Entertainment",
    icon: "PartyPopper",
    subcategories: [
      "Event Planners",
      "Wedding Services",
      "Photography",
      "Videography",
      "Decorators",
      "Entertainment",
      "Cinema",
      "Party Halls",
    ],
  },
  {
    name: "Jobs & Services",
    icon: "Wrench",
    subcategories: [
      "Recruitment Agencies",
      "Freelancers",
      "IT Services",
      "Repair Services",
      "Home Services",
      "Security Services",
      "Delivery Services",
    ],
  },
  {
    name: "Other",
    icon: "LayoutGrid",
    subcategories: [
      "NGOs",
      "Religious/Community Organisations",
      "Pet Services",
      "Agriculture",
      "Manufacturing",
      "Wholesale",
      "Other Businesses",
    ],
  },
];

const TEST_CATEGORY_NAMES = [
  "Test Restaurants",
  "Ai Agency",
  "Seafood & Grill",
  "Tours & Travel",
];

async function main() {
  console.log("Starting Category Taxonomy Seeding...");

  const createdCategoriesMap = new Map();
  let totalTopLevel = 0;
  let totalSubcategories = 0;

  // 1. Seed Taxonomy
  for (let i = 0; i < TAXONOMY.length; i++) {
    const parentItem = TAXONOMY[i];
    const parentSlug = slugify(parentItem.name);

    let parentCategory = await prisma.category.findFirst({
      where: {
        OR: [{ name: parentItem.name }, { slug: parentSlug }],
      },
    });

    if (!parentCategory) {
      parentCategory = await prisma.category.create({
        data: {
          name: parentItem.name,
          slug: parentSlug,
          iconUrl: parentItem.icon,
          status: "active",
          sortOrder: i + 1,
        },
      });
      console.log(`✓ Created Top-Level Category: "${parentCategory.name}" (${parentItem.icon})`);
    } else {
      if (parentCategory.iconUrl !== parentItem.icon) {
        parentCategory = await prisma.category.update({
          where: { id: parentCategory.id },
          data: { iconUrl: parentItem.icon },
        });
        console.log(`✓ Updated Top-Level Category Icon: "${parentCategory.name}" -> ${parentItem.icon}`);
      } else {
        console.log(`- Top-Level Category already exists: "${parentCategory.name}"`);
      }
    }

    createdCategoriesMap.set(parentItem.name, parentCategory);
    totalTopLevel++;

    // Seed Subcategories
    for (let j = 0; j < parentItem.subcategories.length; j++) {
      const subName = parentItem.subcategories[j];
      const subSlug = slugify(subName);

      let subCategory = await prisma.category.findFirst({
        where: {
          OR: [{ name: subName }, { slug: subSlug }],
          parentId: parentCategory.id,
        },
      });

      if (!subCategory) {
        subCategory = await prisma.category.create({
          data: {
            parentId: parentCategory.id,
            name: subName,
            slug: subSlug,
            status: "active",
            sortOrder: j + 1,
          },
        });
        console.log(`  └─ Created Subcategory: "${subCategory.name}" under "${parentCategory.name}"`);
      } else {
        console.log(`  └─ Subcategory already exists: "${subCategory.name}"`);
      }

      createdCategoriesMap.set(subName, subCategory);
      totalSubcategories++;
    }
  }

  // 2. Reassign businesses attached to test categories before deletion
  const itServicesCategory = createdCategoriesMap.get("IT Services") || createdCategoriesMap.get("Jobs & Services");
  const travelCategory = createdCategoriesMap.get("Travel Agencies") || createdCategoriesMap.get("Hotels, Travel & Tourism");
  const foodCategory = createdCategoriesMap.get("Restaurants") || createdCategoriesMap.get("Food & Dining");

  const testCategories = await prisma.category.findMany({
    where: {
      name: { in: TEST_CATEGORY_NAMES },
    },
  });

  const testCategoryIds = testCategories.map((c) => c.id);

  if (testCategoryIds.length > 0) {
    console.log("\nReassigning existing businesses from test categories to new taxonomy...");

    if (itServicesCategory) {
      await prisma.business.updateMany({
        where: { categoryId: { in: testCategoryIds } },
        data: { categoryId: itServicesCategory.id },
      });
      console.log(`✓ Reassigned businesses to "${itServicesCategory.name}"`);
    }

    console.log("\nDeleting test categories as requested...");
    await prisma.category.deleteMany({
      where: { id: { in: testCategoryIds } },
    });
    console.log("✓ Test categories deleted successfully!");
  }

  console.log("\n=========================================");
  console.log("TAXONOMY SEEDING COMPLETED SUCCESSFULLY!");
  console.log(`- Top-Level Categories: ${totalTopLevel}`);
  console.log(`- Total Subcategories:   ${totalSubcategories}`);
  console.log("=========================================");
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
