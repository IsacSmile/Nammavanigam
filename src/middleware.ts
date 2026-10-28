import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const role = token?.role;

  // Protect /admin/* -> Only role === "admin"
  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") {
      return NextResponse.next();
    }

    if (!token) {
      const url = new URL("/admin/login", req.url);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }

    if (role !== "admin") {
      const url = new URL("/admin/login", req.url);
      url.searchParams.set("error", "AccessDeniedAdminOnly");
      return NextResponse.redirect(url);
    }
  }

  // Protect /dashboard/* and /my-businesses -> Only role === "business_owner" or role === "admin"
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/my-businesses")) {
    if (!token) {
      const url = new URL("/login", req.url);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }

    if (role !== "business_owner" && role !== "admin") {
      const url = new URL("/login", req.url);
      url.searchParams.set("error", "AccessDeniedBusinessOnly");
      return NextResponse.redirect(url);
    }
  }

  // Protect /add-business -> Require logged-in user (role: user, business_owner, or admin)
  if (pathname.startsWith("/add-business")) {
    if (!token) {
      const url = new URL("/login", req.url);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*", "/my-businesses", "/my-businesses/:path*", "/add-business"],
};
