"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-72YCQ2WBQ9";
const GA_ID_REGEX = /^G-[A-Z0-9]{6,14}$/;

export default function GoogleAnalytics() {
  const pathname = usePathname();

  const isValidId = Boolean(GA_MEASUREMENT_ID && GA_ID_REGEX.test(GA_MEASUREMENT_ID));

  useEffect(() => {
    if (!isValidId || !GA_MEASUREMENT_ID) return;
    (window as any)[`ga-disable-${GA_MEASUREMENT_ID}`] = pathname
      ? pathname.indexOf("/admin") === 0
      : false;
  }, [pathname, isValidId]);

  if (!isValidId || !GA_MEASUREMENT_ID) {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          window['ga-disable-${GA_MEASUREMENT_ID}'] = location.pathname.indexOf('/admin') === 0;
          gtag('config', '${GA_MEASUREMENT_ID}');
        `}
      </Script>
    </>
  );
}
