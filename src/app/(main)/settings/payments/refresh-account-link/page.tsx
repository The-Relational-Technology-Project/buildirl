"use client";

import { useEffect } from "react";
import { Alert, Loader, Stack, Text, Title } from "@mantine/core";
import { api } from "~/trpc/react";
import { logger } from "~/client/logger";
import AbsoluteCenter from "~/client/components/AbsoluteCenter";

export default function RefreshAccountLink() {
  const createAccountLink = api.payments.createAccountLink.useMutation({
    onSuccess: (data) => {
      window.location.href = data.redirectUrl;
    },
    onError: (e) => {
      logger.error(e, "failed to refresh account link");
    }
  });

  useEffect(() => {
    createAccountLink.mutate({
      origin: window.location.origin
    });
  }, []);

  return (
    <AbsoluteCenter adjustForHeader={true}>
      <Stack align="center" gap={"xl"} justify="center">
        <Title order={3} fw={500}>
          Refreshing Your Account Link
        </Title>

        {createAccountLink.isPending && (
          <Stack align="center" gap="md">
            <Text>Creating a new account link...</Text>
            <Loader size="lg" color={"black"} />
          </Stack>
        )}

        {createAccountLink.isError && (
          <Alert color="red" title="Error" maw={500}>
            An unexpected error occurred while refreshing your account link.
            Please try again or contact support if this issue persists.
          </Alert>
        )}
      </Stack>
    </AbsoluteCenter>
  );
}
