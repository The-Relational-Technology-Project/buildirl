import { createSSRClient } from "~/utils/supabase/auth/ssrClient";

/**
 * we want to resolve this via supabase SSR rather than trpc to
 * avoid hooks and therefore `use client` on the components that
 * require this
 */
export async function isUserAuthenticated() {
  // we want to resolve this via supabase SSR to avoid `use client` for
  // the entire main route group
  const supabase = await createSSRClient();
  const r = await supabase.auth.getSession();
  return r.data.session !== null;
}
