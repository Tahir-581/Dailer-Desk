import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const publicRoutes = [
    "/login",
    "/signup",
    "/api/auth",
    "/create-organization",
    "/api/rag",
    "/api/workflows",
    "/api/internal",
  ];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  const sessionCookie = request.cookies.get("better-auth.session_token");

  if (!isPublicRoute && !sessionCookie) {
    const url = new URL("/login", request.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
