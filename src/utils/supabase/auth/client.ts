import {
  createBrowserClient,
  createServerClient,
  serializeCookieHeader
} from "@supabase/ssr";
import { type NextApiRequest, type NextApiResponse } from "next";

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
