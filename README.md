# Cloudnary used with Niha's email and vercel is used with edverses as well github is used with isacsmile and neon is also used with Niha's email

# 🌴 Namma Vanigam — Local Business Directory Platform

A modern, full-stack local business directory and classifieds platform built specifically for Tamil Nadu. Powered by **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, **Prisma ORM**, **Neon PostgreSQL**, and **NextAuth.js**.

---

## ✨ Features

### 🏢 Local Business Discovery

- **Categorized Listings**: Explore businesses organized into 12 top-level categories and 95+ subcategories (Healthcare, Education, Food & Dining, Home & Property, Automotive, etc.).
- **Localized Search**: Filter listings across 18+ sub-localities in Kochi (Fort Kochi, Edappally, Kakkanad, Vyttila, Aluva, Marine Drive, etc.).
- **Interactive Directory**: View detailed business pages with address, contact info, WhatsApp direct links, map coordinates, image galleries, and operating hours.

### 🔐 Authentication & Roles

- **Role-Based Access Control**:
  - **User**: Search businesses, leave reviews, and report inappropriate content.
  - **Business Owner**: Submit and edit business listings, manage media uploads, and track listing status.
  - **Admin**: Review, approve/reject pending business submissions, moderate reported reviews, and manage platform taxonomies.
- **Secure Authentication**: NextAuth.js credentials provider with `bcryptjs` password hashing.

### 🌟 Reviews & Moderation

- Star ratings and detailed user reviews on business listings.
- Review reporting system with dedicated admin moderation queue.

### 🖼️ Media & Cloudinary Integration

- Cloud-based image upload and management for business logos, banners, and gallery photos using Cloudinary.

### 📱 Responsive & Performant

- Fully responsive design optimized for mobile, tablet, and desktop viewports.
- SEO-optimized with dynamic `sitemap.xml` and `robots.txt` generation.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 14 (App Router)](https://nextjs.org/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [Lucide Icons](https://lucide.dev/)
- **Database**: PostgreSQL (hosted on [Neon](https://neon.tech/))
- **ORM**: [Prisma ORM](https://www.prisma.io/)
- **Authentication**: [NextAuth.js](https://next-auth.js.org/)
- **Media Hosting**: [Cloudinary](https://cloudinary.com/)

---

## 🚀 Getting Started

### 1. Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher
- PostgreSQL Database (Local or Neon PostgreSQL)

### 2. Clone the Repository

```bash
git clone https://github.com/IsacSmile/kochi-classifieds-mains.git
cd kochi-classifieds-mains
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Environment Variables

Create a `.env` file in the root directory:

```env
DATABASE_URL="postgresql://user:password@host:5432/neondb?sslmode=require&schema=kochi_classifieds"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret-key"

ADMIN_EMAIL="admin@nammavanigam.online"
ADMIN_PASSWORD="YourAdminPassword123!"

CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
CLOUDINARY_URL="cloudinary://api_key:api_secret@cloud_name"

GOOGLE_MAPS_API_KEY=""
RAZORPAY_KEY_ID=""
RAZORPAY_KEY_SECRET=""
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-9M5745SWML
```

> **Note**: `NEXT_PUBLIC_GA_MEASUREMENT_ID` is baked in at build time, so changing it needs a redeploy, and it should be set for Production only.

### 5. Setup Database & Prisma

Generate the Prisma client and push the schema to your database:

```bash
npm run prisma:generate
npx prisma db push
```

### 6. Seed Initial Data

Seed taxonomy (categories, subcategories, Kochi locations) and the default admin user:

```bash
node scripts/seed-categories.js
node scripts/seed-locations.js
node scripts/seed-admin.js
```

### 7. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📜 Available Scripts

| Command                   | Description                                              |
| ------------------------- | -------------------------------------------------------- |
| `npm run dev`             | Starts the Next.js development server                    |
| `npm run build`           | Generates Prisma Client and builds the production bundle |
| `npm run start`           | Runs the production build                                |
| `npm run lint`            | Runs Next.js ESLint checks                               |
| `npm run prisma:generate` | Generates Prisma Client artifacts                        |
| `npm run prisma:migrate`  | Runs Prisma database migrations                          |

---

## 📂 Project Structure

```
.
├── prisma/
│   ├── schema.prisma        # Database models & relationships
│   └── migrations/          # Database migrations history
├── public/                  # Static assets & icons
├── scripts/                 # Data seeding scripts (categories, locations, admin)
├── src/
│   ├── app/                 # Next.js App Router (Pages, API routes, Layouts)
│   │   ├── add-business/    # Business submission page
│   │   ├── admin/           # Admin dashboard & moderation UI
│   │   ├── api/             # REST API endpoints (Auth, Business, Reviews)
│   │   ├── business/        # Business detail pages
│   │   ├── dashboard/       # User/Business owner dashboard
│   │   ├── my-businesses/   # Owner listings management
│   │   └── search/          # Search & directory filtering page
│   ├── components/          # Reusable UI components & layouts
│   ├── lib/                 # Prisma client, auth config, Cloudinary & utilities
│   ├── middleware.ts        # Route protection & role verification
│   └── types/               # TypeScript type definitions
└── README.md
```

---

## 📄 License

This project is proprietary and intended for local business directory operations in Kochi.
