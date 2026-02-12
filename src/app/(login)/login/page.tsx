"use client";

import AuthenticationForm from "~/app/(login)/login/_components/AuthenticationForm";
import { useEffect } from "react";
import { createComponentClient } from "~/utils/supabase/auth/client";
import { useRouter } from "next/navigation";
import AbsoluteCenter from "~/client/components/AbsoluteCenter";
import WithDefaultColorSchemeOnManualRouteChange from "~/client/components/WithDefaultColorSchemeOnManualRouteChange";
import posthog from "posthog-js";
import { Box } from "@mantine/core";

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
      <Box
        mih="100vh"
        style={{
          backgroundImage: "url(/images/buildirl_login.webp)",
          backgroundSize: "cover",
          backgroundPosition: "center"
        }}
      >
        <AbsoluteCenter mih="100vh" w="100%">
          <AuthenticationForm />
        </AbsoluteCenter>
      </Box>
    </WithDefaultColorSchemeOnManualRouteChange>
  );
}
