import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

// Define the public routes
const publicRoutes = ["/"];
const authRoutes = ["/auth"];

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // If the route is public, allow access
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Get the JWT token from cookies
  const jwtToken = request.cookies.get("auth.token")?.value;
  const isAuthenticated = !!jwtToken && (await isValidAuthJwtToken(jwtToken));

  // If is authenticated and the route is a login page, redirect to home
  if (isAuthenticated && authRoutes.includes(pathname)) {
    request.nextUrl.pathname = "/";
    return NextResponse.redirect(request.nextUrl);
  }

  // If is not authenticated and is not a login page, redirect to login page
  if (!isAuthenticated && !authRoutes.includes(pathname)) {
    request.nextUrl.pathname = "/auth";
    request.nextUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(request.nextUrl);
  }

  // If the token is valid, proceed to the requested route
  return NextResponse.next();
}

// Specify the routes where this middleware should apply
export const config = {
  matcher: "/((?!_next/static|api|favicon.ico).*)", // Apply to all routes except static files or favicon
};

// Light jwt verification that does not require o1js
const isValidAuthJwtToken = async (token: string): Promise<boolean> => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error("JWT_SECRET env is not defined");
  }
  const secret = new TextEncoder().encode(jwtSecret);
  try {
    const { payload } = await jwtVerify<{ publicKey: string }>(token, secret);
    if (!payload.publicKey) return false;
    return true;
  } catch {
    return false;
  }
};
