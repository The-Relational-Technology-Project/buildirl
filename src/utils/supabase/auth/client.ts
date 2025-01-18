import {
  createBrowserClient,
  createServerClient,
  serializeCookieHeader
} from "@supabase/ssr";
import { type NextApiRequest, type NextApiResponse } from "next";
import { NextRequest, NextResponse } from "next/server";
import { Maybe } from "~/utils/types";
import { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";

// https://supabase.com/docs/guides/auth/server-side/nextjs
/**
 * Server-side auth enabled supabase client to be invoked
 * in API route handlers
 */
export function createApiClient(req: NextApiRequest, res: NextApiResponse) {
  // noinspection DuplicatedCode
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return Object.entries(req.cookies)
            .filter(([_, value]) => value !== undefined)
            .map(([name, value]) => ({ name, value: value! }));
        },
        setAll(cookiesToSet) {
          res.setHeader(
            "Set-Cookie",
            cookiesToSet.map(({ name, value, options }) =>
              serializeCookieHeader(name, value, options)
            )
          );
        }
      }
    }
  );
}

/**
 * Server-side auth enabled supabase client to be invoked
 * in browser / client-side
 */
export function createComponentClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

/**
 * Server-side auth enabled supabase client to be invoked
 * in middleware
 *
 * This takes in an optional response and sets upstream cookies
 */
export function createMiddlewareClient(
  req: NextRequest,
  res: Maybe<NextResponse>
) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // no-op if no response
          if (null === res) {
            return;
          }
          cookiesToSet.forEach(({ name, value, options }) =>
            req.cookies.set(name, value)
          );
          res = NextResponse.next({
            request: req
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            res!.cookies.set(name, value, options)
          );
        }
      }
    }
  );
}
