"use client";

import { Center } from "@mantine/core";
import { AuthenticationForm } from "~/client/components/AuthenticationForm";
import { useEffect } from "react";
import { createComponentClient } from "~/utils/supabase/auth/client";
import { useRouter } from "next/navigation";

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
    <Center h="80vh">
      <AuthenticationForm />
    </Center>
  );
}
