const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

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
const prisma = new PrismaClient();

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[\s\W-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Icon mapping for NammaBiz main categories
const MAIN_CATEGORY_ICONS = {
  "Automotive & Vehicles": "Car",
  "Home & Property Services": "Home",
  "Real Estate": "Home",
  "Construction & Industrial": "Wrench",
  "Food & Dining": "UtensilsCrossed",
  "Healthcare & Medical": "Stethoscope",
  "Education & Training": "GraduationCap",
  "Beauty, Fashion & Wellness": "Sparkles",
  "Hotels, Travel & Tourism": "Hotel",
  "Events, Media & Entertainment": "PartyPopper",
  "Shopping & Retail": "ShoppingBag",
  "Professional & Business Services": "Briefcase",
  "IT, Software & Digital": "Laptop",
  "Finance, Banking & Insurance": "Briefcase",
  "Logistics, Transport & Warehousing": "Car",
  "Agriculture & Farming": "LayoutGrid",
  "Electrical, Plumbing & Hardware": "Wrench",
  "Repairs & Personal Services": "Wrench",
  "Arts, Culture & Handicrafts": "Sparkles",
  "Security & Safety": "Briefcase",
  "Printing, Signage & Packaging": "Briefcase",
  "Manufacturing & Wholesale": "Briefcase",
  "Sports, Recreation & Kids": "PartyPopper",
  "Pets & Animal Services": "LayoutGrid",
  "Telecom & Utilities": "Laptop",
  "Environmental & Waste Services": "Wrench",
  "Government & Public Services": "Briefcase",
  "Religious & Community": "LayoutGrid",
  "Other Local Services": "LayoutGrid",
};

async function main() {
  console.log("=====================================================");
  console.log("STARTING DATABASE MIGRATION TO TAMIL NADU & NAMMABIZ");
  console.log("=====================================================\n");

  // 1. Remove existing businesses and child tables to prevent foreign key errors
  console.log("1. Clearing existing businesses...");
  await prisma.reviewReport.deleteMany({});
  await prisma.review.deleteMany({});
  await prisma.businessService.deleteMany({});
  await prisma.businessPhoto.deleteMany({});
  await prisma.businessHour.deleteMany({});
  await prisma.businessPhone.deleteMany({});
  await prisma.businessSocialLink.deleteMany({});
  await prisma.business.deleteMany({});
  console.log("✓ Cleared all businesses & relations.");

  // 2. Clear all categories & locations
  console.log("2. Clearing old categories and locations...");
  await prisma.category.deleteMany({});
  await prisma.location.deleteMany({});
  console.log("✓ Completely removed all old categories and locations.\n");

  // 3. Process Tamil Nadu Districts and Taluks
  console.log("3. Seeding Tamil Nadu Districts & Taluks from 'Tamil_Nadu_Complete_District_Taluk_List (1).xlsx'...");
  const locFilePath = path.join(__dirname, "../Tamil_Nadu_Complete_District_Taluk_List (1).xlsx");
  if (!fs.existsSync(locFilePath)) {
    throw new Error(`Location file not found at: ${locFilePath}`);
  }

  const locWb = XLSX.readFile(locFilePath);
  const locRows = XLSX.utils.sheet_to_json(locWb.Sheets[locWb.SheetNames[0]]);

  // Group by District
  const districtMap = new Map();
  for (const r of locRows) {
    const dName = r.District ? String(r.District).trim() : "";
    const tName = r.Taluk ? String(r.Taluk).trim() : "";
    if (!dName) continue;
    if (!districtMap.has(dName)) {
      districtMap.set(dName, []);
    }
    if (tName && !districtMap.get(dName).includes(tName)) {
      districtMap.get(dName).push(tName);
    }
  }

  const usedLocationSlugs = new Set();
  const districtDbMap = new Map(); // districtName -> db record
  let districtSort = 1;
  let totalDistrictsCreated = 0;
  let totalTaluksCreated = 0;

  for (const [districtName, taluks] of districtMap.entries()) {
    let dSlug = slugify(districtName);
    if (usedLocationSlugs.has(dSlug)) {
      dSlug = `${dSlug}-district`;
    }
    usedLocationSlugs.add(dSlug);

    const createdDistrict = await prisma.location.create({
      data: {
        name: districtName,
        slug: dSlug,
        parentId: null,
        status: "active",
        sortOrder: districtSort++,
      },
    });
    districtDbMap.set(districtName, createdDistrict);
    totalDistrictsCreated++;

    // Seed Taluks
    let talukSort = 1;
    for (const talukName of taluks) {
      let tSlug = slugify(talukName);
      if (tSlug === dSlug || usedLocationSlugs.has(tSlug)) {
        tSlug = `${tSlug}-${dSlug}`;
        if (usedLocationSlugs.has(tSlug)) {
          tSlug = `${tSlug}-taluk`;
        }
      }
      usedLocationSlugs.add(tSlug);

      await prisma.location.create({
        data: {
          name: talukName,
          slug: tSlug,
          parentId: createdDistrict.id,
          status: "active",
          sortOrder: talukSort++,
        },
      });
      totalTaluksCreated++;
    }
  }

  console.log(`✓ Seeded ${totalDistrictsCreated} Districts and ${totalTaluksCreated} Taluks for Tamil Nadu.\n`);

  // 4. Process NammaBiz Business Categories
  console.log("4. Seeding Categories from 'NammaBiz_Business_Categories (1).xlsx'...");
  const catFilePath = path.join(__dirname, "../NammaBiz_Business_Categories (1).xlsx");
  if (!fs.existsSync(catFilePath)) {
    throw new Error(`Category file not found at: ${catFilePath}`);
  }

  const catWb = XLSX.readFile(catFilePath);

  // Read Main Categories order
  let mainCategoriesList = [];
  if (catWb.SheetNames.includes("Main Categories")) {
    const mainRows = XLSX.utils.sheet_to_json(catWb.Sheets["Main Categories"]);
    mainCategoriesList = mainRows
      .map((r) => (r["Main Category"] ? String(r["Main Category"]).trim() : ""))
      .filter(Boolean);
  }

  // Read Category Master
  const masterRows = XLSX.utils.sheet_to_json(catWb.Sheets["Category Master"]);
  const categoryTree = new Map(); // mainCategory -> [subcategories]

  // If Main Categories sheet had list, initialize them first
  for (const m of mainCategoriesList) {
    if (!categoryTree.has(m)) categoryTree.set(m, []);
  }

  for (const r of masterRows) {
    const mainCat = r["Main Category"] ? String(r["Main Category"]).trim() : "";
    const subCat = r["Subcategory"] ? String(r["Subcategory"]).trim() : "";
    if (!mainCat) continue;
    if (!categoryTree.has(mainCat)) {
      categoryTree.set(mainCat, []);
    }
    if (subCat && !categoryTree.get(mainCat).includes(subCat)) {
      categoryTree.get(mainCat).push(subCat);
    }
  }

  const usedCategorySlugs = new Set();
  const categoryDbMap = new Map(); // mainCatName -> db record
  let catSort = 1;
  let totalMainCategories = 0;
  let totalSubcategories = 0;

  for (const [mainCatName, subcategories] of categoryTree.entries()) {
    let mSlug = slugify(mainCatName);
    if (usedCategorySlugs.has(mSlug)) {
      mSlug = `${mSlug}-category`;
    }
    usedCategorySlugs.add(mSlug);

    const icon = MAIN_CATEGORY_ICONS[mainCatName] || "LayoutGrid";

    const createdMain = await prisma.category.create({
      data: {
        name: mainCatName,
        slug: mSlug,
        parentId: null,
        iconUrl: icon,
        status: "active",
        sortOrder: catSort++,
      },
    });
    categoryDbMap.set(mainCatName, createdMain);
    totalMainCategories++;

    // Seed Subcategories
    let subSort = 1;
    for (const subName of subcategories) {
      let sSlug = slugify(subName);
      if (usedCategorySlugs.has(sSlug)) {
        sSlug = `${sSlug}-${mSlug}`;
        if (usedCategorySlugs.has(sSlug)) {
          sSlug = `${sSlug}-${subSort}`;
        }
      }
      usedCategorySlugs.add(sSlug);

      await prisma.category.create({
        data: {
          name: subName,
          slug: sSlug,
          parentId: createdMain.id,
          status: "active",
          sortOrder: subSort++,
        },
      });
      totalSubcategories++;
    }
  }

  console.log(`✓ Seeded ${totalMainCategories} Main Categories and ${totalSubcategories} Subcategories.\n`);

  // 5. Seed 4 dummy showcase businesses linked to Tamil Nadu locations & categories
  console.log("5. Re-seeding 4 showcase businesses in Tamil Nadu...");
  const adminUser = await prisma.user.findFirst({ where: { role: "admin" } });
  if (adminUser) {
    const chennai = districtDbMap.get("Chennai") || (await prisma.location.findFirst({ where: { name: "Chennai" } }));
    const guindy = (await prisma.location.findFirst({ where: { name: "Guindy" } })) || chennai;
    const mylapore = (await prisma.location.findFirst({ where: { name: "Mylapore" } })) || chennai;
    const coimbatore = districtDbMap.get("Coimbatore") || chennai;

    const itCat = await prisma.category.findFirst({ where: { name: "Web Design Companies" } }) || (await prisma.category.findFirst({ where: { slug: "it-software-and-digital" } }));
    const foodCat = await prisma.category.findFirst({ where: { name: "Cafes" } }) || (await prisma.category.findFirst({ where: { slug: "food-and-dining" } }));
    const resortCat = await prisma.category.findFirst({ where: { name: "Resorts" } }) || (await prisma.category.findFirst({ where: { slug: "hotels-travel-and-tourism" } }));
    const salonCat = await prisma.category.findFirst({ where: { name: "Unisex Salons" } }) || (await prisma.category.findFirst({ where: { slug: "beauty-fashion-and-wellness" } }));

    const standardHours = [
      { day: "Monday", openingTime: "09:00", closingTime: "19:00", closed: false },
      { day: "Tuesday", openingTime: "09:00", closingTime: "19:00", closed: false },
      { day: "Wednesday", openingTime: "09:00", closingTime: "19:00", closed: false },
      { day: "Thursday", openingTime: "09:00", closingTime: "19:00", closed: false },
      { day: "Friday", openingTime: "09:00", closingTime: "19:00", closed: false },
      { day: "Saturday", openingTime: "10:00", closingTime: "18:00", closed: false },
      { day: "Sunday", openingTime: "10:00", closingTime: "14:00", closed: true },
    ];

    const cafeHours = [
      { day: "Monday", openingTime: "08:00", closingTime: "22:00", closed: false },
      { day: "Tuesday", openingTime: "08:00", closingTime: "22:00", closed: false },
      { day: "Wednesday", openingTime: "08:00", closingTime: "22:00", closed: false },
      { day: "Thursday", openingTime: "08:00", closingTime: "22:00", closed: false },
      { day: "Friday", openingTime: "08:00", closingTime: "23:00", closed: false },
      { day: "Saturday", openingTime: "08:00", closingTime: "23:00", closed: false },
      { day: "Sunday", openingTime: "09:00", closingTime: "22:00", closed: false },
    ];

    const fullDummy = [
      {
        name: "Niha Tech Solutions",
        slug: "niha-tech-solutions",
        categoryId: itCat.id,
        locationId: guindy.id,
        description: "Niha Tech Solutions is a premier digital technology agency in Guindy, Chennai. We specialize in bespoke website design, e-commerce web applications, and SEO.",
        address: "Guindy Industrial Estate, Chennai, Tamil Nadu 600032",
        phone: "+91 98470 12345",
        whatsapp: "+91 98470 12345",
        email: "contact@nihatechsolutions.in",
        website: "https://nihatechsolutions.in",
        showcaseOrder: 1,
        featured: true,
        verified: true,
        status: "approved",
        photos: [
          { imageUrl: "/images/dummy-niha-logo.svg", altText: "Niha Tech Solutions official logo", sortOrder: 0 },
          { imageUrl: "/images/dummy-web-design.jpg", altText: "Modern responsive web design showcase", sortOrder: 1 },
          { imageUrl: "/images/dummy-web-design-2.jpg", altText: "Development team workspace", sortOrder: 2 },
        ],
        services: [
          { serviceName: "Custom Web Application Development", description: "Bespoke Next.js & React full-stack websites with optimized SEO.", price: 25000 },
          { serviceName: "E-Commerce Online Store Setup", description: "Turnkey e-commerce solutions with payment gateway.", price: 35000 },
        ],
        hours: standardHours,
        phones: [{ number: "+91 98470 12345", label: "Direct Support", sortOrder: 1 }],
        socialLinks: [{ platform: "instagram", url: "https://instagram.com/nihatech" }],
      },
      {
        name: "Namma Craft Coffee House",
        slug: "namma-craft-coffee-house",
        categoryId: foodCat.id,
        locationId: mylapore.id,
        description: "Specialty coffee roastery and artisan cafe in Mylapore, Chennai. Single-origin Arabica beans, pour-overs, nitro cold brews, and fresh pastries.",
        address: "Luz Church Road, Mylapore, Chennai, Tamil Nadu 600004",
        phone: "+91 98471 23456",
        whatsapp: "+91 98471 23456",
        email: "hello@nammacoffeehouse.com",
        website: "https://nammacoffeehouse.com",
        showcaseOrder: 2,
        featured: true,
        verified: true,
        status: "approved",
        photos: [
          { imageUrl: "/images/dummy-coffee-logo.svg", altText: "Namma Craft Coffee House logo", sortOrder: 0 },
          { imageUrl: "/images/dummy-coffee-house.jpg", altText: "Main coffee bar with warm lighting", sortOrder: 1 },
          { imageUrl: "/images/dummy-coffee-2.jpg", altText: "Freshly poured specialty latte art", sortOrder: 2 },
        ],
        services: [
          { serviceName: "Artisan Pour-Over", description: "Single-origin hand brew extracted to perfection.", price: 240 },
          { serviceName: "Signature 18-Hour Cold Brew", description: "Smooth chocolate finish served over ice.", price: 280 },
        ],
        hours: cafeHours,
        phones: [{ number: "+91 98471 23456", label: "Table Reservations", sortOrder: 1 }],
        socialLinks: [{ platform: "instagram", url: "https://instagram.com/nammacoffeehouse" }],
      },
      {
        name: "Grand Heritage Resort & Spas",
        slug: "grand-heritage-resort-and-spas",
        categoryId: resortCat.id,
        locationId: coimbatore.id,
        description: "Luxury eco-resort nestled near the foothills of the Western Ghats. Authentic wellness therapies, infinity pool, and lakeside dining.",
        address: "Hill View Road, Coimbatore, Tamil Nadu 641001",
        phone: "+91 98472 34567",
        whatsapp: "+91 98472 34567",
        email: "reservations@grandheritageresort.in",
        website: "https://grandheritageresort.in",
        showcaseOrder: 3,
        featured: true,
        verified: true,
        status: "approved",
        photos: [
          { imageUrl: "/images/dummy-resort-logo.svg", altText: "Grand Heritage Resort logo", sortOrder: 0 },
          { imageUrl: "/images/dummy-resort.jpg", altText: "Lakeside pavilion and pool", sortOrder: 1 },
        ],
        services: [
          { serviceName: "Deluxe Pool Villa (per night)", description: "Spacious private villa with plunge pool.", price: 9500 },
        ],
        hours: standardHours,
        phones: [{ number: "+91 98472 34567", label: "24/7 Concierge", sortOrder: 1 }],
        socialLinks: [{ platform: "instagram", url: "https://instagram.com/grandheritageresort" }],
      },
      {
        name: "Lumiere Luxury Hair & Salon",
        slug: "lumiere-luxury-hair-and-salon",
        categoryId: salonCat.id,
        locationId: guindy.id,
        description: "Destination of choice for high-end hairstyling, beauty treatments, and wellness care in Guindy, Chennai.",
        address: "Anna Salai, Guindy, Chennai, Tamil Nadu 600032",
        phone: "+91 98473 45678",
        whatsapp: "+91 98473 45678",
        email: "bookings@lumieresalon.in",
        website: "https://lumieresalon.in",
        showcaseOrder: 4,
        featured: true,
        verified: true,
        status: "approved",
        photos: [
          { imageUrl: "/images/dummy-salon-logo.svg", altText: "Lumiere Luxury Hair logo", sortOrder: 0 },
          { imageUrl: "/images/dummy-salon.jpg", altText: "Main styling salon hall", sortOrder: 1 },
        ],
        services: [
          { serviceName: "Master Haircut & Blowdry", description: "Face-contour consultation and custom haircut.", price: 1100 },
        ],
        hours: standardHours,
        phones: [{ number: "+91 98473 45678", label: "Appointment Desk", sortOrder: 1 }],
        socialLinks: [{ platform: "instagram", url: "https://instagram.com/lumiereluxurysalon" }],
      },
    ];

    for (const b of fullDummy) {
      const created = await prisma.business.create({
        data: {
          ownerId: adminUser.id,
          name: b.name,
          slug: b.slug,
          categoryId: b.categoryId,
          locationId: b.locationId,
          description: b.description,
          address: b.address,
          phone: b.phone,
          whatsapp: b.whatsapp,
          email: b.email,
          website: b.website,
          showcaseOrder: b.showcaseOrder,
          featured: b.featured,
          verified: b.verified,
          status: b.status,
          businessPhotos: { create: b.photos },
          businessServices: { create: b.services },
          businessHours: { create: b.hours },
          businessPhones: { create: b.phones },
          businessSocialLinks: { create: b.socialLinks },
        },
      });
      console.log(`  └─ Re-seeded showcase business: ${created.name}`);
    }
  }

  console.log("\n=====================================================");
  console.log("TAMIL NADU & NAMMABIZ SEEDING COMPLETE SUCCESSFULLY!");
  console.log("=====================================================");
}

main()
  .catch((e) => {
    console.error("Migration failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

