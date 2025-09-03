import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  console.log("THIS IS THE CURRENT PATH - ", path);

  const token = (await request.cookies.get("user")?.value) || "";
  let redirectURL = "/";

  if (token) {
    console.log("USER TOKEN EXISTS");
    const parsedToken = JSON.parse(token);
    const userAccess = parsedToken.labels[0];
    console.log("LABEL FROM TOKEN - ", userAccess);
    

    switch (userAccess) {
      case "biller":
        redirectURL = "/biller";
        break;
      case "security":
        redirectURL = "/security";
        break;
      case "admin":
        redirectURL = "/admin";
        break;
        case "caller":

      default:
        break;
    }

    console.log("REDIRECTING TO - ", redirectURL);
    console.log(path.startsWith(redirectURL));

    if (!path.startsWith(redirectURL)) {
      return NextResponse.redirect(new URL(redirectURL, request.nextUrl));
    }
  } else {
    console.log("USER TOKEN DOES NOT EXIST");
    if (!(path == redirectURL)) {
      return NextResponse.redirect(new URL("/", request.nextUrl));
    }
  }
}

export const config = {
  matcher: [
    "/biller/:path*",
    "/security/:path*",
    "/admin/:path*",
    "/",
  ],
};
