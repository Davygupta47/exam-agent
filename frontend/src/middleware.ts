import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("token")?.value;

  // Protect dashboard routes
  const isStudentRoute = pathname.startsWith("/student");
  const isFacultyRoute = pathname.startsWith("/faculty");
  const isAdminRoute = pathname.startsWith("/admin");

  if (isStudentRoute || isFacultyRoute || isAdminRoute) {
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      if (isFacultyRoute) loginUrl.searchParams.set("role", "faculty");
      else if (isAdminRoute) loginUrl.searchParams.set("role", "admin");
      else loginUrl.searchParams.set("role", "student");
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/student/:path*",
    "/faculty/:path*",
    "/admin/:path*",
  ],
};
