"use client";

import { Box, Stack, Text, Title } from "@mantine/core";
import React from "react";
import { api } from "~/trpc/react";
import { QueryError } from "~/client/utils/QueryError";
import { isLoaded } from "~/client/utils";
import { Button } from "@mantine/core";

export default function PaymentsPanel() {
  const r = api.payments.customerPortalLink.useQuery();

  QueryError.checkNullable({
    result: r,
    fieldName: "customerPortalLink"
  });

  return (
    isLoaded(r) && (
      <Stack mt={"lg"} gap={4}>
        <Title order={4}>Payments</Title>
        <Text size={"md"}>
          Manage your payment details and subscriptions through Stripe.
        </Text>
        <Box mt={"md"}>
          <Button component="a" href={r.data!} target="_blank">
            Manage Payments
          </Button>
        </Box>
      </Stack>
    )
  );
}
