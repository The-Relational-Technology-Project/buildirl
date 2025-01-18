import { NextResponse, type NextRequest } from "next/server";
import { type User } from "@supabase/auth-js";
import { createMiddlewareClient } from "~/utils/supabase/auth/client";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request
  });

  const supabase = createMiddlewareClient(request, supabaseResponse);

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user }
  } = await supabase.auth.getUser();

  function redirect(pathname: string): NextResponse {
    const url = request.nextUrl.clone();
    url.pathname = pathname;
    return NextResponse.redirect(url);
  }
  async function isOnboarded(user: User): Promise<boolean> {
    const result = await supabase
      .from("user")
      .select("id")
      .eq("authUserId", user.id)
      .maybeSingle();

    if (!!result.error) {
      throw new Error(result.error.message);
    }

    return !!result.data;
  }

  // do not redirect for these excluded endpoints
  if (request.nextUrl.pathname.startsWith("/api/auth/confirm")) {
    return supabaseResponse;
  }

  if (!user && !request.nextUrl.pathname.startsWith("/login")) {
    // no user, potentially respond by redirecting the user to the login page
    return redirect("/login");
  }

  if (user && request.nextUrl.pathname.startsWith("/login")) {
    // user is logged in, redirect to the index
    return redirect("/");
  }

  if (user) {
    const onboarded = await isOnboarded(user);
    if (onboarded && request.nextUrl.pathname.startsWith("/onboarding")) {
      // redirect to index from onboarding if already onboarded
      return redirect("/");
    }
    if (!onboarded && !request.nextUrl.pathname.startsWith("/onboarding")) {
      // redirect to onboarding if not yet onboarded
      return redirect("/onboarding");
    }
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse;
}
