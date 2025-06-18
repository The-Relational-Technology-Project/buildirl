"use client";

import {
  Button,
  Stack,
  Text,
  List,
  Box,
  Tooltip,
  Group,
  ThemeIcon,
  PaperProps,
  Paper,
  Title,
  Anchor
} from "@mantine/core";
import React from "react";
import { api } from "~/trpc/react";
import { handleDefaultMutationError } from "~/client/logger";
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
    onError: handleDefaultMutationError
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
    onError: handleDefaultMutationError
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

function StripeGuidePanel({ ...props }: PaperProps) {
  return (
    <Paper p="lg" {...props}>
      <Stack gap="xs">
        <Title order={5}>First time with Stripe?</Title>
        <Text>
          {"Check out our "}
          <Anchor
            href="https://tulip-iron-c45.notion.site/Get-Member-Contributions-by-connecting-Stripe-in-Minutes-1e2a8ae4b4d280ce900ec09ac73fccd7"
            target="_blank"
          >
            Stripe setup guide
          </Anchor>
          .
        </Text>
      </Stack>
    </Paper>
  );
}

type StripeConnectPanelProps = {
  clubId: number;
};

export default function StripeConnectPanel({
  clubId
}: StripeConnectPanelProps) {
  const accountStatus = api.payments.accountStatus.useQuery(
    { clubId },
    {
      // refetch every 1 minute as data can be changed externally in Stripe
      refetchInterval: 60 * 1000
    }
  );

  QueryError.checkNullable({
    result: accountStatus,
    fieldName: "accountStatus"
  });

  return (
    isLoaded(accountStatus) && (
      <Stack>
        <Stack mt={"xl"} gap={4} align={"center"}>
          <Text size={"md"}>
            Manage your Stripe Connect account to receive member contributions
          </Text>
          {accountStatus.data === null ? (
            <CreateStripeConnectAccount clubId={clubId} />
          ) : (
            <ManageStripeConnectAccount
              clubId={clubId}
              status={accountStatus.data!}
            />
          )}
        </Stack>
        <StripeGuidePanel mt={20} />
      </Stack>
    )
  );
}
