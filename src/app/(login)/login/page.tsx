"use client";

import { AuthenticationForm } from "~/app/(login)/login/_components/AuthenticationForm";
import { useEffect } from "react";
import { createComponentClient } from "~/utils/supabase/auth/client";
import { useRouter } from "next/navigation";
import { AbsoluteCenter } from "~/client/components/AbsoluteCenter";

export default function Login() {
  const supabase = createComponentClient();
  const router = useRouter();

  useEffect(() => {
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        router.refresh();
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth, router]);

  return (
    <AbsoluteCenter>
      <AuthenticationForm />
    </AbsoluteCenter>
  );
}
