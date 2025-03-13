import { Button, Stack, Text, Title } from "@mantine/core";
import React from "react";

function CreateStripeConnectAccount() {
  return (
    <Button w={200} mt={"lg"}>
      Create Account
    </Button>
  );
}

function ManageStripeConnectAccount() {
  return <></>;
}

export default function StripeConnectPanel() {
  return (
    <Stack mt={"lg"} gap={4}>
      <Title order={4}>Stripe Connect</Title>
      <Text size={"md"}>
        Use your Stripe Connect account to receive member contributions.
      </Text>
    </Stack>
  );
}
