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

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("Error: DATABASE_URL environment variable is missing.");
  process.exit(1);
}

const adminEmail = process.env.ADMIN_EMAIL;
const rawPassword = process.env.ADMIN_PASSWORD;

if (!adminEmail || !rawPassword) {
  console.error("Error: ADMIN_EMAIL and ADMIN_PASSWORD environment variables must be defined in your .env file.");
  process.exit(1);
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: dbUrl,
    },
  },
});

async function main() {
  console.log("Seeding Admin user from environment configuration...");

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  const passwordHash = await bcrypt.hash(rawPassword, 10);

  if (existingAdmin) {
    // Ensure role is admin and password matches .env
    await prisma.user.update({
      where: { email: adminEmail },
      data: { role: "admin", status: "active", passwordHash },
    });
    console.log("✓ Existing admin user updated with role=admin and password from .env:", adminEmail);
    return;
  }

  const adminUser = await prisma.user.create({
    data: {
      name: "Admin",
      email: adminEmail,
      phone: "+91 9876543210",
      passwordHash,
      role: "admin",
      status: "active",
    },
  });

  console.log("✓ Admin user created successfully!");
  console.log("-----------------------------------------");
  console.log("Email:    ", adminUser.email);
  console.log("Role:     ", adminUser.role);
  console.log("-----------------------------------------");
}

main()
  .catch((e) => {
    console.error("Failed to seed admin user:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
