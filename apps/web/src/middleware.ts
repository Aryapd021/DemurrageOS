import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Next.js Edge Middleware
 *
 * Protected routes: everything under /(app)/* i.e. /dashboard, /containers,
 * /clients, /tasks, /alerts, /analytics, /imports, /settings
 *
 * Public routes: /landing, /login, /register, /forgot-password,
 * /reset-password, /verify-email, /confirm/* (trucker links)
 */

const PUBLIC_PATHS = [
  "/landing",
  "/login",
  "/register",
  "/verify-email",
  "/forgot-password",
  "/reset-password",
  "/confirm",  // trucker confirmation — always public
  "/terms",    // legal pages — public
  "/privacy",  // legal pages — public
  "/videos",   // video files — public
  "/images",   // image files — public
  "/_next",
  "/favicon",
  "/api/auth", // auth endpoints must be reachable unauthenticated
];

const STATIC_EXTENSIONS = [
  ".mp4", ".webm", ".ogg",
  ".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".ico",
  ".woff", ".woff2", ".ttf",
];

function isPublic(pathname: string): boolean {
  if (pathname === "/") return true;
  if (STATIC_EXTENSIONS.some((ext) => pathname.endsWith(ext))) return true;
  return PUBLIC_PATHS.some((p) => pathname.startsWith(p));
}

/** Name of the session cookie */
const SESSION_COOKIE = "better-auth.session_token";
const DEMO_COOKIE = "demurrage_demo_session";

export function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  // If opening root "/", redirect straight to landing page by default
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/landing", req.url));
  }

  // Always allow public routes and static assets
  if (isPublic(pathname)) return NextResponse.next();

  // If URL has ?demo=true, grant instant demo session cookie and allow access
  if (searchParams.get("demo") === "true") {
    const cleanUrl = new URL(pathname, req.url);
    const response = NextResponse.redirect(cleanUrl);
    response.cookies.set(SESSION_COOKIE, "demo_active_token", {
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
    });
    response.cookies.set(DEMO_COOKIE, "true", {
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
    });
    return response;
  }

  // Check for session cookie
  const sessionCookie =
    req.cookies.get(SESSION_COOKIE)?.value || req.cookies.get(DEMO_COOKIE)?.value;

  if (!sessionCookie) {
    // Not authenticated → redirect to login
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Cookie present — let the request through
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths EXCEPT:
     * - static files (_next/static, _next/image, favicon.ico)
     * - api routes handled by Next.js itself
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
