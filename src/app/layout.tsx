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
    default: "Namma Vanigam - Local Business Directory",
    template: "%s | Namma Vanigam",
  },
  description:
    "Find verified local businesses, shops, doctors, restaurants, and services. List your business free.",
  openGraph: {
    title: "Namma Vanigam - Local Business Directory",
    description:
      "Find verified local businesses, shops, doctors, restaurants, and services. List your business free.",
    url: baseUrl,
    siteName: "Namma Vanigam",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "/namma-vaniga-logo.webp",
        width: 1536,
        height: 1024,
        alt: "Namma Vanigam",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Namma Vanigam - Local Business Directory",
    description: "Find verified local businesses and services.",
    images: ["/namma-vaniga-logo.webp"],
  },
  robots: {
    index: true,
    follow: true,
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
      <body className="antialiased bg-white text-brand-navy min-h-screen" suppressHydrationWarning>
        <GoogleAnalytics />
        <SessionProvider>
          {children}
          <BookAppointmentButton />
        </SessionProvider>
      </body>
    </html>
  );
}
