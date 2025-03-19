"use client";

import { Alert, Button, Group, Stack, Text, Title, List } from "@mantine/core";
import React from "react";
import { api } from "~/trpc/react";
import { logger } from "~/client/logger";
import { AccountStatus } from "~/server/payments/types";
import { QueryError } from "~/client/utils/QueryError";
import { isLoaded } from "~/client/utils";

function CreateStripeConnectAccount() {
  const apiUtils = api.useUtils();
  const createAccount = api.payments.createAccount.useMutation({
    onSuccess: () => {
      void apiUtils.payments.accountStatus.invalidate();
    },
    onError: (e) => {
      logger.error(e, "failed to creating Stripe Connect account");
    }
  });

  return (
    <Button
      w={200}
      mt={"lg"}
      onClick={async () => {
        await createAccount.mutateAsync();
      }}
      loading={createAccount.isPending}
    >
      Create Account
    </Button>
  );
}

type ManageStripeConnectAccountProps = {
  status: AccountStatus;
};

function ManageStripeConnectAccount({
  status
}: ManageStripeConnectAccountProps) {
  const createAccountLink = api.payments.createAccountLink.useMutation({
    onSuccess: (r) => {
      window.location.href = r.redirectUrl;
    },
    onError: (e) => {
      logger.error(e, "failed to create account link");
    }
  });

  return (
    <Stack mt="lg" gap="md">
      {!status.isComplete && status.missingRequirements.length > 0 && (
        <Alert color="yellow" title="Missing Account Requirements">
          <Text mb="xs">Please complete the following requirements:</Text>
          <List size="sm">
            {status.missingRequirements.map((req, index) => (
              <List.Item key={index}>{req}</List.Item>
            ))}
          </List>
        </Alert>
      )}

      <Group>
        {status.isComplete ? (
          <Button
            component="a"
            href="https://dashboard.stripe.com/"
            target="_blank"
          >
            Manage Stripe Dashboard
          </Button>
        ) : (
          <Button
            onClick={async () => {
              await createAccountLink.mutateAsync({
                origin: window.location.origin
              });
            }}
            loading={createAccountLink.isPending}
          >
            Complete Account Setup
          </Button>
        )}
      </Group>
    </Stack>
  );
}

export default function StripeConnectPanel() {
  const r = api.payments.accountStatus.useQuery();

  QueryError.checkNullable({
    result: r,
    fieldName: "accountStatus"
  });

  return (
    isLoaded(r) && (
      <Stack mt={"lg"} gap={4}>
        <Title order={4}>Stripe Connect</Title>
        <Text size={"md"}>
          Use your Stripe Connect account to receive member contributions.
        </Text>
        {r.data === null ? (
          <CreateStripeConnectAccount />
        ) : (
          <ManageStripeConnectAccount status={r.data!} />
        )}
      </Stack>
    )
  );
}
