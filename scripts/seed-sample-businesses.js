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
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding complete 4 dummy businesses with all 7-step details...");

  // 1. Get or create admin user to be owner
  const adminUser = await prisma.user.findFirst({
    where: { role: "admin" },
  });
  if (!adminUser) {
    console.error("No admin user found. Run seed-admin.js first.");
    process.exit(1);
  }

  // Ensure reviewer users exist for ratings
  const reviewerPass = await bcrypt.hash("Password123!", 10);
  const reviewer1 = await prisma.user.upsert({
    where: { email: "rahul.nair@example.com" },
    update: {},
    create: {
      name: "Rahul Nair",
      email: "rahul.nair@example.com",
      passwordHash: reviewerPass,
      role: "user",
      status: "active",
    },
  });

  const reviewer2 = await prisma.user.upsert({
    where: { email: "ananya.menon@example.com" },
    update: {},
    create: {
      name: "Ananya Menon",
      email: "ananya.menon@example.com",
      passwordHash: reviewerPass,
      role: "user",
      status: "active",
    },
  });

  // 2. Ensure Districts and Taluks exist
  let ernakulam = await prisma.location.findFirst({
    where: { slug: "ernakulam-district" },
  });
  if (!ernakulam) {
    ernakulam = await prisma.location.create({
      data: {
        name: "Ernakulam",
        slug: "ernakulam-district",
        parentId: null,
        status: "active",
        sortOrder: 1,
      },
    });
  }

  let kanayannur = await prisma.location.findFirst({
    where: { slug: "kanayannur" },
  });
  if (!kanayannur) {
    kanayannur = await prisma.location.create({
      data: {
        name: "Kanayannur",
        slug: "kanayannur",
        parentId: ernakulam.id,
        status: "active",
        sortOrder: 1,
      },
    });
  } else if (kanayannur.parentId !== ernakulam.id) {
    await prisma.location.update({
      where: { id: kanayannur.id },
      data: { parentId: ernakulam.id },
    });
  }

  let kochiTaluk = await prisma.location.findFirst({
    where: { slug: "kochi-taluk" },
  });
  if (!kochiTaluk) {
    kochiTaluk = await prisma.location.create({
      data: {
        name: "Kochi",
        slug: "kochi-taluk",
        parentId: ernakulam.id,
        status: "active",
        sortOrder: 2,
      },
    });
  }

  // Categories
  const webCat = await prisma.category.findFirst({ where: { slug: "web-design" } });
  const cafeCat = await prisma.category.findFirst({ where: { slug: "cafes-and-coffee-shops" } });
  const hotelCat = await prisma.category.findFirst({ where: { slug: "hotels-travel-and-tourism" } });
  const salonCat = await prisma.category.findFirst({ where: { slug: "salons" } });

  const standardWeekHours = [
    { day: "Monday", openingTime: "09:00", closingTime: "19:00", closed: false },
    { day: "Tuesday", openingTime: "09:00", closingTime: "19:00", closed: false },
    { day: "Wednesday", openingTime: "09:00", closingTime: "19:00", closed: false },
    { day: "Thursday", openingTime: "09:00", closingTime: "19:00", closed: false },
    { day: "Friday", openingTime: "09:00", closingTime: "19:00", closed: false },
    { day: "Saturday", openingTime: "10:00", closingTime: "18:00", closed: false },
    { day: "Sunday", openingTime: "10:00", closingTime: "14:00", closed: true },
  ];

  const cafeWeekHours = [
    { day: "Monday", openingTime: "08:00", closingTime: "22:00", closed: false },
    { day: "Tuesday", openingTime: "08:00", closingTime: "22:00", closed: false },
    { day: "Wednesday", openingTime: "08:00", closingTime: "22:00", closed: false },
    { day: "Thursday", openingTime: "08:00", closingTime: "22:00", closed: false },
    { day: "Friday", openingTime: "08:00", closingTime: "23:00", closed: false },
    { day: "Saturday", openingTime: "08:00", closingTime: "23:00", closed: false },
    { day: "Sunday", openingTime: "09:00", closingTime: "22:00", closed: false },
  ];

  const resortWeekHours = [
    { day: "Monday", openingTime: "00:00", closingTime: "23:59", closed: false },
    { day: "Tuesday", openingTime: "00:00", closingTime: "23:59", closed: false },
    { day: "Wednesday", openingTime: "00:00", closingTime: "23:59", closed: false },
    { day: "Thursday", openingTime: "00:00", closingTime: "23:59", closed: false },
    { day: "Friday", openingTime: "00:00", closingTime: "23:59", closed: false },
    { day: "Saturday", openingTime: "00:00", closingTime: "23:59", closed: false },
    { day: "Sunday", openingTime: "00:00", closingTime: "23:59", closed: false },
  ];

  const fullBusinesses = [
    {
      name: "Niha Tech Solutions",
      slug: "niha-tech-solutions",
      categoryId: webCat ? webCat.id : 80,
      locationId: kanayannur.id,
      description:
        "Niha Tech Solutions is a premier digital technology agency based in Ernakulam. We specialize in bespoke website design, high-converting e-commerce web applications, search engine optimization (SEO), and corporate brand identity. With a proven track record of serving over 150+ local businesses, we transform digital footprints into sustainable business growth.",
      address: "2nd Floor, IT Park Towers, Bypass Road, Kanayannur, Ernakulam, Kerala 682028",
      latitude: 9.9816,
      longitude: 76.2999,
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
        { imageUrl: "/images/dummy-web-design-2.jpg", altText: "Development team workspace and coding", sortOrder: 2 },
        { imageUrl: "/images/dummy-web-design-3.jpg", altText: "Analytics, digital dashboard and SEO reporting", sortOrder: 3 },
      ],
      services: [
        { serviceName: "Custom Web Application Development", description: "Bespoke Next.js & React full-stack websites with optimized SEO and ultra-fast loading speed.", price: 25000 },
        { serviceName: "E-Commerce Online Store Setup", description: "Turnkey e-commerce solutions with payment gateway, catalog, and WhatsApp order notification.", price: 35000 },
        { serviceName: "Search Engine Optimization (SEO)", description: "Local business ranking optimization, Google My Business setup, and keyword growth strategy.", price: 12000 },
        { serviceName: "Corporate UI/UX & Brand Design", description: "Complete brand guidelines, modern logo creation, vector assets, and responsive wireframes.", price: 15000 },
      ],
      hours: standardWeekHours,
      phones: [
        { number: "+91 98470 12345", label: "Direct Support", sortOrder: 1 },
        { number: "+91 0484 2987654", label: "Office Landline", sortOrder: 2 },
      ],
      socialLinks: [
        { platform: "instagram", url: "https://instagram.com/nihatech" },
        { platform: "facebook", url: "https://facebook.com/nihatechsolutions" },
        { platform: "linkedin", url: "https://linkedin.com/company/nihatech" },
      ],
      reviews: [
        { userId: reviewer1.id, rating: 5, comment: "Niha Tech delivered our company website in just 10 days. The design is sleek, modern, and loads instantly on mobile. Highly recommended!" },
        { userId: reviewer2.id, rating: 5, comment: "Exceptional team to work with. Our local leads through Google and WhatsApp doubled within two months of launching." },
      ],
    },
    {
      name: "Kochi Craft Coffee House",
      slug: "kochi-craft-coffee-house",
      categoryId: cafeCat ? cafeCat.id : 3,
      locationId: kanayannur.id,
      description:
        "Kochi Craft Coffee House is a cozy specialty coffee roastery and artisan cafe in Kanayannur. Sourcing 100% single-origin Arabica beans directly from the lush estates of Wayanad, we hand-roast each batch in-house. Enjoy pour-overs, nitro cold brews, freshly baked artisanal sourdough pastries, and a peaceful green ambiance equipped with fast fiber Wi-Fi.",
      address: "Ground Floor, Heritage Square, Near Metro Pillar 542, Kanayannur, Ernakulam, Kerala 682025",
      latitude: 9.9723,
      longitude: 76.3124,
      phone: "+91 98471 23456",
      whatsapp: "+91 98471 23456",
      email: "hello@kochicoffeehouse.com",
      website: "https://kochicoffeehouse.com",
      showcaseOrder: 2,
      featured: true,
      verified: true,
      status: "approved",
      photos: [
        { imageUrl: "/images/dummy-coffee-logo.svg", altText: "Kochi Craft Coffee House logo", sortOrder: 0 },
        { imageUrl: "/images/dummy-coffee-house.jpg", altText: "Main coffee bar with warm lighting and espresso machine", sortOrder: 1 },
        { imageUrl: "/images/dummy-coffee-2.jpg", altText: "Freshly poured specialty latte art with roasted coffee beans", sortOrder: 2 },
        { imageUrl: "/images/dummy-coffee-3.jpg", altText: "Outdoor garden patio seating area", sortOrder: 3 },
      ],
      services: [
        { serviceName: "Artisan Pour-Over & AeroPress", description: "Single-origin hand brew extracted to perfection for rich flavor notes and pleasant aroma.", price: 240 },
        { serviceName: "Signature 18-Hour Cold Brew", description: "Steeped overnight with Wayanad beans, smooth chocolate finish, served over ice.", price: 280 },
        { serviceName: "Artisanal Sourdough Avocado Toast", description: "Toasted sourdough bread topped with creamy Haas avocado, cherry tomatoes, and microgreens.", price: 340 },
        { serviceName: "French Bakery Dessert Platter", description: "Selection of freshly baked butter croissants, chocolate eclairs, and almond tarts.", price: 420 },
      ],
      hours: cafeWeekHours,
      phones: [
        { number: "+91 98471 23456", label: "Table Reservations", sortOrder: 1 },
        { number: "+91 0484 2765432", label: "Cafe Front Desk", sortOrder: 2 },
      ],
      socialLinks: [
        { platform: "instagram", url: "https://instagram.com/kochicoffeehouse" },
        { platform: "facebook", url: "https://facebook.com/kochicoffeehouse" },
      ],
      reviews: [
        { userId: reviewer1.id, rating: 5, comment: "Best cold brew in Ernakulam! Perfect atmosphere for reading or remote work with lightning-fast Wi-Fi." },
        { userId: reviewer2.id, rating: 5, comment: "A hidden gem. The baristas really understand their craft and the sourdough croissants are heavenly." },
      ],
    },
    {
      name: "Grand Heritage Resort & Spas",
      slug: "grand-heritage-resort-and-spas",
      categoryId: hotelCat ? hotelCat.id : 10,
      locationId: kochiTaluk.id,
      description:
        "Nestled along the calm backwaters of Kochi, Grand Heritage Resort & Spas blends traditional Kerala timber architecture with world-class contemporary hospitality. Featuring tranquil pool villas, authentic Ayurvedic Panchakarma treatments, multi-cuisine lakeside dining, and sunset boat cruises, we offer an unforgettable luxury sanctuary.",
      address: "Resort Road, Backwater Promenade, Kochi, Ernakulam, Kerala 682001",
      latitude: 9.9654,
      longitude: 76.2487,
      phone: "+91 98472 34567",
      whatsapp: "+91 98472 34567",
      email: "reservations@grandheritageresort.in",
      website: "https://grandheritageresort.in",
      showcaseOrder: 3,
      featured: true,
      verified: true,
      status: "approved",
      photos: [
        { imageUrl: "/images/dummy-resort-logo.svg", altText: "Grand Heritage Resort & Spas logo", sortOrder: 0 },
        { imageUrl: "/images/dummy-resort.jpg", altText: "Lakeside wooden pavilion and infinity pool", sortOrder: 1 },
        { imageUrl: "/images/dummy-resort-2.jpg", altText: "Deluxe water villa with private sun deck", sortOrder: 2 },
        { imageUrl: "/images/dummy-resort-3.jpg", altText: "Evening candlelight poolside dining under coconut trees", sortOrder: 3 },
      ],
      services: [
        { serviceName: "Deluxe Pool Heritage Villa (per night)", description: "Spacious private villa with open-to-sky shower, King bed, plunge pool, and lake view.", price: 9500 },
        { serviceName: "Traditional Ayurvedic Rejuvenation Spa", description: "60-minute Abhyanga herbal oil massage by certified therapists followed by herbal steam.", price: 3200 },
        { serviceName: "Sunset Backwater Cruise & High Tea", description: "2-hour motorized boat cruise through serene waterways with traditional Kerala snacks.", price: 1800 },
        { serviceName: "Candlelight Backwater Private Dinner", description: "Exclusive 4-course bespoke dinner by the private jetty with romantic ambient decor.", price: 5500 },
      ],
      hours: resortWeekHours,
      phones: [
        { number: "+91 98472 34567", label: "24/7 Concierge", sortOrder: 1 },
        { number: "+91 0484 2876543", label: "Front Desk & Reservations", sortOrder: 2 },
      ],
      socialLinks: [
        { platform: "instagram", url: "https://instagram.com/grandheritageresort" },
        { platform: "facebook", url: "https://facebook.com/grandheritageresort" },
      ],
      reviews: [
        { userId: reviewer1.id, rating: 5, comment: "An oasis of calm right in Kochi. The Ayurvedic massage was wonderfully rejuvenating and the waterfront views are serene." },
        { userId: reviewer2.id, rating: 5, comment: "Top-notch hospitality. The staff made our anniversary weekend truly special with thoughtful arrangements." },
      ],
    },
    {
      name: "Lumiere Luxury Hair & Salon",
      slug: "lumiere-luxury-hair-and-salon",
      categoryId: salonCat ? salonCat.id : 57,
      locationId: kanayannur.id,
      description:
        "Lumiere Luxury Hair & Salon is the destination of choice for high-end hairstyling, beauty treatments, and wellness care in Kanayannur. Staffed by certified master stylists and international beauty artists, we provide precision haircuts, bespoke hair coloring, botanical scalp therapies, organic facials, and couture bridal makeovers in a sterile, opulent environment.",
      address: "Shop 14-16, City Centre Mall, 1st Floor, Kanayannur, Ernakulam, Kerala 682016",
      latitude: 9.9782,
      longitude: 76.3051,
      phone: "+91 98473 45678",
      whatsapp: "+91 98473 45678",
      email: "bookings@lumieresalon.in",
      website: "https://lumieresalon.in",
      showcaseOrder: 4,
      featured: true,
      verified: true,
      status: "approved",
      photos: [
        { imageUrl: "/images/dummy-salon-logo.svg", altText: "Lumiere Luxury Hair & Salon logo", sortOrder: 0 },
        { imageUrl: "/images/dummy-salon.jpg", altText: "Main styling salon hall with modern ergonomic chairs", sortOrder: 1 },
        { imageUrl: "/images/dummy-salon-2.jpg", altText: "Professional precision haircut and hair styling session", sortOrder: 2 },
        { imageUrl: "/images/dummy-salon-3.jpg", altText: "Private bridal suite and hair spa wash station", sortOrder: 3 },
      ],
      services: [
        { serviceName: "Signature Master Haircut & Blowdry", description: "Face-contour consultation, custom haircut, deep wash, conditioning, and luxury blowdry.", price: 1100 },
        { serviceName: "Brazilian Keratin Silk Smoothing", description: "Formaldehyde-free protein infusion that eliminates frizz and leaves silky shine for 4 months.", price: 5500 },
        { serviceName: "Couture Bridal HD Makeover", description: "Airbrush HD makeup, advanced bridal hair styling, saree draping, and luxury touch-up kit.", price: 14000 },
        { serviceName: "Moroccan Argan Oil Deep Hair Spa", description: "Scalp massage, deep moisture mask, ozone steam therapy, and split-end repair.", price: 2600 },
      ],
      hours: standardWeekHours,
      phones: [
        { number: "+91 98473 45678", label: "Appointment Desk", sortOrder: 1 },
        { number: "+91 0484 2654321", label: "Reception", sortOrder: 2 },
      ],
      socialLinks: [
        { platform: "instagram", url: "https://instagram.com/lumiereluxurysalon" },
        { platform: "facebook", url: "https://facebook.com/lumiereluxurysalon" },
      ],
      reviews: [
        { userId: reviewer1.id, rating: 5, comment: "Incredible attention to detail. The senior stylist gave me the exact layered cut I requested. Very professional ambiance." },
        { userId: reviewer2.id, rating: 5, comment: "Booked my sister's bridal makeover here. She looked breathtaking! The staff was courteous and punctual." },
      ],
    },
  ];

  for (const b of fullBusinesses) {
    const existing = await prisma.business.findUnique({
      where: { slug: b.slug },
    });

    let bizId;

    if (existing) {
      console.log(`Updating existing business with full details: "${b.name}"`);
      const updated = await prisma.business.update({
        where: { id: existing.id },
        data: {
          name: b.name,
          categoryId: b.categoryId,
          locationId: b.locationId,
          description: b.description,
          address: b.address,
          latitude: b.latitude,
          longitude: b.longitude,
          phone: b.phone,
          whatsapp: b.whatsapp,
          email: b.email,
          website: b.website,
          showcaseOrder: b.showcaseOrder,
          featured: b.featured,
          verified: b.verified,
          status: b.status,
        },
      });
      bizId = updated.id;
    } else {
      console.log(`Creating business with full details: "${b.name}"`);
      const created = await prisma.business.create({
        data: {
          ownerId: adminUser.id,
          name: b.name,
          slug: b.slug,
          categoryId: b.categoryId,
          locationId: b.locationId,
          description: b.description,
          address: b.address,
          latitude: b.latitude,
          longitude: b.longitude,
          phone: b.phone,
          whatsapp: b.whatsapp,
          email: b.email,
          website: b.website,
          showcaseOrder: b.showcaseOrder,
          featured: b.featured,
          verified: b.verified,
          status: b.status,
        },
      });
      bizId = created.id;
    }

    // 1. Photos
    await prisma.businessPhoto.deleteMany({ where: { businessId: bizId } });
    await prisma.businessPhoto.createMany({
      data: b.photos.map((p) => ({ ...p, businessId: bizId })),
    });

    // 2. Services
    await prisma.businessService.deleteMany({ where: { businessId: bizId } });
    await prisma.businessService.createMany({
      data: b.services.map((s) => ({ ...s, businessId: bizId })),
    });

    // 3. Hours
    await prisma.businessHour.deleteMany({ where: { businessId: bizId } });
    await prisma.businessHour.createMany({
      data: b.hours.map((h) => ({ ...h, businessId: bizId })),
    });

    // 4. Phones
    await prisma.businessPhone.deleteMany({ where: { businessId: bizId } });
    await prisma.businessPhone.createMany({
      data: b.phones.map((p) => ({ ...p, businessId: bizId })),
    });

    // 5. Social Links
    await prisma.businessSocialLink.deleteMany({ where: { businessId: bizId } });
    await prisma.businessSocialLink.createMany({
      data: b.socialLinks.map((s) => ({ ...s, businessId: bizId })),
    });

    // 6. Reviews
    await prisma.review.deleteMany({ where: { businessId: bizId } });
    for (const r of b.reviews) {
      await prisma.review.create({
        data: {
          businessId: bizId,
          userId: r.userId,
          rating: r.rating,
          comment: r.comment,
        },
      });
    }

    console.log(`✓ Completely configured business #${bizId}: ${b.name}`);
  }

  console.log("\nAll 4 businesses fully configured with photos, services, hours, phones, social links, and reviews!");
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
