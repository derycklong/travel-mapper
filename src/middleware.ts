import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === "/") {
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    const ua = request.headers.get("user-agent") || "";
    console.log(`[VISIT] ${new Date().toISOString()} | IP: ${ip} | UA: ${ua.slice(0, 80)}`);
  }
  return NextResponse.next();
}

export const config = {
  matcher: "/",
};
