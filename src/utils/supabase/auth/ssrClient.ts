import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server-side auth enabled supabase client to be invoked
 * in server side rendering
 *
 * Note: This needed to be separated from the client.ts file because
 * of build-time import issues in client-side files
 */
export async function createSSRClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        }
      }
    }
  );
}
