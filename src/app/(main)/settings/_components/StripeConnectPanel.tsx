"use client";

import { Button, Stack, Text, Title, List, Box, Tooltip } from "@mantine/core";
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
    <Box mt={"md"}>
      <Button
        onClick={async () => {
          await createAccount.mutateAsync();
        }}
        loading={createAccount.isPending}
      >
        Create Account
      </Button>
    </Box>
  );
}

type MissingRequirementsToolTipProps = {
  requirements: string[];
};

function MissingRequirementsToolTip({
  requirements
}: MissingRequirementsToolTipProps) {
  return (
    <Stack gap={"xs"} p={4}>
      <Title order={6}>Missing Requirements</Title>
      <List size="sm">
        {requirements.map((req, index) => (
          <List.Item key={index}>{req}</List.Item>
        ))}
      </List>
    </Stack>
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
    <Box mt={"md"}>
      {status.isComplete ? (
        <Button
          component="a"
          href="https://dashboard.stripe.com/"
          target="_blank"
        >
          Manage Stripe Dashboard
        </Button>
      ) : (
        <Tooltip
          position={"bottom-start"}
          label={
            <MissingRequirementsToolTip
              requirements={status.missingRequirements}
            />
          }
          hidden={status.missingRequirements.length === 0}
        >
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
        </Tooltip>
      )}
    </Box>
  );
}

export default function StripeConnectPanel() {
  const r = api.payments.accountStatus.useQuery(undefined, {
    // refetch every 1 minute as data can be changed externally in Stripe
    refetchInterval: 60 * 1000
  });

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
