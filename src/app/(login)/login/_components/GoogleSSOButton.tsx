import { Button, ButtonProps } from "@mantine/core";
import React from "react";
import { IconBrandGoogleFilled } from "@tabler/icons-react";
import { SupabaseClient } from "@supabase/supabase-js";
import { logger, notifyError } from "~/client/logger";

type GoogleSSOButtonProps = {
  supabase: SupabaseClient;
};

export default function GoogleSSOButton({
  supabase,
  ...props
}: GoogleSSOButtonProps & ButtonProps) {
  const handleClick = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          // redirect back here with the same search params
          // so that middleware can properly route them
          // back to the right page
          redirectTo: window.location.href
        }
      });

      if (error) throw error;
    } catch (e) {
      logger.error(e, "failed to sign in with Google SSO");
      notifyError(
        "There was an error in signing in with Google. Please try again."
      );
    }
  };

  return (
    <Button
      color={"blue"}
      {...props}
      leftSection={<IconBrandGoogleFilled size={18} />}
      onClick={handleClick}
    >
      Sign-in with Google
    </Button>
  );
}
