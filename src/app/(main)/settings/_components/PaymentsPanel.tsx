"use client";

import { Stack, Text, Title } from "@mantine/core";
import React from "react";
import ManagePaymentsButton from "~/app/(main)/settings/_components/ManagePaymentsButton";

export default function PaymentsPanel() {
  return (
    <Stack mt={"lg"} gap={4}>
      <Title order={4}>Payments</Title>
      <Text size={"md"}>
        Manage your payment details and subscriptions through Stripe.
      </Text>
      <ManagePaymentsButton mt={"md"} />
    </Stack>
  );
}
