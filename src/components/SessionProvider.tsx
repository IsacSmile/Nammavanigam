"use client";

import { useEffect, useState } from "react";
import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";

export default function SessionProvider({ children }: { children: React.ReactNode }) {
  const [position, setPosition] = useState<"top-right" | "bottom-center">("top-right");

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setPosition("bottom-center");
      } else {
        setPosition("top-right");
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <NextAuthSessionProvider>
      {children}
      <Toaster
        position={position}
        toastOptions={{
          duration: 3000,
          style: {
            fontSize: "13px",
            fontWeight: "600",
            borderRadius: "12px",
            padding: "12px 16px",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
          },
          success: {
            style: {
              background: "#1A8A2E",
              color: "#ffffff",
            },
            iconTheme: {
              primary: "#ffffff",
              secondary: "#1A8A2E",
            },
          },
          error: {
            style: {
              background: "#DC2626",
              color: "#ffffff",
            },
            iconTheme: {
              primary: "#ffffff",
              secondary: "#DC2626",
            },
          },
        }}
      />
    </NextAuthSessionProvider>
  );
}

