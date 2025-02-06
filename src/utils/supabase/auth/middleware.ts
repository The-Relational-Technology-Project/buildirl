import { NextResponse, type NextRequest } from "next/server";
import { type User } from "@supabase/auth-js";
import { createMiddlewareClient } from "~/utils/supabase/auth/client";
import { logger } from "~/client/logger";

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

  function redirect(
    pathname: string,
    params: Record<string, string> = {},
    keepExistingParams: boolean = false
  ): NextResponse {
    const url = request.nextUrl.clone();

    if (!keepExistingParams) {
      // clear existing search params
      for (const key of [...url.searchParams.keys()]) {
        url.searchParams.delete(key);
      }
    }

    // add new search params
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    url.pathname = pathname;
    return NextResponse.redirect(url);
  }

  function redirectToRedirectUrlIfItExistsOtherwiseRedirectToRoot() {
    // if there is a redirect url
    const redirectUrl = request.nextUrl.searchParams.get("redirect");
    if (redirectUrl) {
      // redirect to the redirect url, retaining all params
      // this still passes the original redirect url as it is possible
      // there will be multiple redirect (e.g., login -> onboarding -> to original page)
      return redirect(redirectUrl, {}, true);
    }

    // otherwise redirect to root
    return redirect("/");
  }

  async function isOnboarded(user: User): Promise<boolean> {
    const result = await supabase
      .from("user")
      .select("id")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (!!result.error) {
      throw new Error(result.error.message);
    }

    return !!result.data;
  }

  // do not redirect for these excluded endpoints
  if (startsWith(request.nextUrl.pathname, ["/api/auth/confirm", "/join"])) {
    return supabaseResponse;
  }

  // no user, respond by redirecting the user to the login page
  if (!user && !request.nextUrl.pathname.startsWith("/login")) {
    return redirect(
      "/login",
      // capture the original URL to redirect back after login
      {
        redirect: request.nextUrl.pathname
      },
      // we want to keep search params of the redirect url too
      true
    );
  }

  if (user && request.nextUrl.pathname.startsWith("/login")) {
    // redirect from login if already logged in
    return redirectToRedirectUrlIfItExistsOtherwiseRedirectToRoot();
  }

  if (user) {
    const onboarded = await isOnboarded(user);
    if (onboarded && request.nextUrl.pathname.startsWith("/onboarding")) {
      // redirect from onboarding if already onboarded
      return redirectToRedirectUrlIfItExistsOtherwiseRedirectToRoot();
    }
    if (!onboarded && !request.nextUrl.pathname.startsWith("/onboarding")) {
      // redirect to onboarding if not yet onboarded
      //
      // retain query params including redirect url, so we can redirect
      // the user to their original route after onboarding completion
      return redirect("/onboarding", {}, true);
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

function startsWith(s: string, m: string[]) {
  return m.some((m) => s.startsWith(m));
}
