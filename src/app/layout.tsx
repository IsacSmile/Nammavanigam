import type { Metadata } from "next";
import "./globals.css";
import SessionProvider from "@/components/SessionProvider";
import BookAppointmentButton from "@/components/BookAppointmentButton";
import GoogleAnalytics from "@/components/GoogleAnalytics";

const rawBaseUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.SITE_URL ||
  (process.env.NEXTAUTH_URL && !process.env.NEXTAUTH_URL.includes("localhost")
    ? process.env.NEXTAUTH_URL
    : "https://nammavanigam.online");
const baseUrl = rawBaseUrl.replace(/\/$/, "");

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Namma Vanigam | Tamil Nadu Local Business Directory & Services",
    template: "%s | Namma Vanigam",
  },
  description:
    "Find verified local businesses, shops, healthcare providers, restaurants, IT services, and professionals across all 38 districts of Tamil Nadu. List your business free.",
  keywords: [
    "Namma Vanigam",
    "Tamil Nadu business directory",
    "Chennai businesses",
    "Coimbatore business listings",
    "Madurai local services",
    "Salem shops",
    "Tiruchirappalli directory",
    "Tamil Nadu classifieds",
    "local business listings Tamil Nadu",
    "doctors in Chennai",
    "top restaurants Tamil Nadu",
    "IT companies Chennai",
    "free business listing Tamil Nadu",
    "b2b portal Tamil Nadu",
    "verified businesses Tamil Nadu",
  ],
  authors: [{ name: "Namma Vanigam", url: baseUrl }],
  creator: "Namma Vanigam",
  publisher: "Namma Vanigam",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: baseUrl,
    languages: {
      "en-IN": baseUrl,
    },
  },
  openGraph: {
    title: "Namma Vanigam | Tamil Nadu Local Business Directory & Services",
    description:
      "Find verified local businesses, shops, healthcare providers, restaurants, and professionals across all 38 districts of Tamil Nadu. List your business free.",
    url: baseUrl,
    siteName: "Namma Vanigam",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "/namma-vaniga-logo.webp",
        width: 1264,
        height: 797,
        alt: "Namma Vanigam - Tamil Nadu Business Directory",
      },
      {
        url: "/icon.png",
        width: 512,
        height: 512,
        alt: "Namma Vanigam Icon",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Namma Vanigam | Tamil Nadu Local Business Directory",
    description:
      "Discover verified local businesses, shops, and services across Tamil Nadu.",
    images: ["/namma-vaniga-logo.webp"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: ["/favicon.ico"],
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <GoogleAnalytics />
      </head>
      <body className="antialiased bg-white text-brand-navy min-h-screen" suppressHydrationWarning>
        <SessionProvider>
          {children}
          <BookAppointmentButton />
        </SessionProvider>
      </body>
    </html>
  );
}
