"use client";

import {
  Button,
  Stack,
  Text,
  List,
  Box,
  Tooltip,
  Group,
  ThemeIcon
} from "@mantine/core";
import React from "react";
import { api } from "~/trpc/react";
import { logger } from "~/client/logger";
import { AccountStatus } from "~/server/payments/types";
import { QueryError } from "~/client/utils/QueryError";
import { isLoaded } from "~/client/utils";
import { IconAlertCircle } from "@tabler/icons-react";

type CreateStripeConnectAccountProps = {
  clubId: number;
};

function CreateStripeConnectAccount({
  clubId
}: CreateStripeConnectAccountProps) {
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
          await createAccount.mutateAsync({ clubId });
        }}
        loading={createAccount.isPending}
      >
        Create Account
      </Button>
    </Box>
  );
}

type MissingRequirementsMessage = {
  requirements: string[];
};

function MissingRequirementsMessage({
  requirements
}: MissingRequirementsMessage) {
  if (requirements.length === 0) {
    return;
  }

  return (
    <Group gap={2}>
      <Text size={"sm"} c={"red"}>
        Account set up not complete. See details.
      </Text>
      <Tooltip
        label={
          <Stack gap={4} p={8}>
            <Text size={"sm"} fw={700}>
              You are missing the following requirements
            </Text>
            <List size="sm">
              {requirements.map((req, index) => (
                <List.Item key={index}>{req}</List.Item>
              ))}
            </List>
          </Stack>
        }
      >
        <ThemeIcon size={"xs"} c={"red"}>
          <IconAlertCircle />
        </ThemeIcon>
      </Tooltip>
    </Group>
  );
}

type ManageStripeConnectAccountProps = {
  clubId: number;
  status: AccountStatus;
};

function ManageStripeConnectAccount({
  clubId,
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
          color={"green"}
        >
          Manage Stripe Dashboard
        </Button>
      ) : (
        <Stack gap={"lg"}>
          <Button
            onClick={async () => {
              await createAccountLink.mutateAsync({
                origin: window.location.origin,
                clubId
              });
            }}
            loading={createAccountLink.isPending}
          >
            Setup Stripe Account
          </Button>
          <MissingRequirementsMessage
            requirements={status.missingRequirements}
          />
        </Stack>
      )}
    </Box>
  );
}

type StripeConnectPanelProps = {
  clubId: number;
};

export default function StripeConnectPanel({
  clubId
}: StripeConnectPanelProps) {
  const r = api.payments.accountStatus.useQuery(
    { clubId },
    {
      // refetch every 1 minute as data can be changed externally in Stripe
      refetchInterval: 60 * 1000
    }
  );

  QueryError.checkNullable({
    result: r,
    fieldName: "accountStatus"
  });

  return (
    isLoaded(r) && (
      <Stack mt={"xl"} gap={4} align={"center"}>
        <Text size={"md"}>
          Manage your Stripe Connect account to receive member contributions
        </Text>
        {r.data === null ? (
          <CreateStripeConnectAccount clubId={clubId} />
        ) : (
          <ManageStripeConnectAccount clubId={clubId} status={r.data!} />
        )}
      </Stack>
    )
  );
}
