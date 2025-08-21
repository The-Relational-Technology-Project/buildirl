"use client";

import AuthenticationForm from "~/app/(login)/login/_components/AuthenticationForm";
import { useEffect } from "react";
import { createComponentClient } from "~/utils/supabase/auth/client";
import { useRouter } from "next/navigation";
import AbsoluteCenter from "~/client/components/AbsoluteCenter";
import WithDefaultColorSchemeOnManualRouteChange from "~/client/components/WithDefaultColorSchemeOnManualRouteChange";
import posthog from "posthog-js";

export default function Login() {
  const supabase = createComponentClient();
  const router = useRouter();

  useEffect(() => {
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        posthog.identify(session.user.id, {
          email: session.user.email
        });
        router.refresh();
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth, router]);

  return (
    <WithDefaultColorSchemeOnManualRouteChange>
      <AbsoluteCenter>
        <AuthenticationForm />
      </AbsoluteCenter>
    </WithDefaultColorSchemeOnManualRouteChange>
  );
}
