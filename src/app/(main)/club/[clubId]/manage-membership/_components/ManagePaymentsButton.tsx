import { Button, Group, GroupProps, ThemeIcon, Tooltip } from "@mantine/core";
import React from "react";
import { api } from "~/trpc/react";
import { IconAlertCircle } from "@tabler/icons-react";
import { logger } from "~/client/logger";

function SubscriptionUpdateWarning() {
  return (
    <Tooltip
      multiline
      w={300}
      label="While the Stripe dashboard allows you to cancel and pause your subscription directly, this is not recommended.
      Club owners are notified of inactive subscriptions. If you wish to cancel your subscription,
      please leave the club through membership management."
      position="right-start"
    >
      <ThemeIcon color={"gray"} size={"sm"}>
        <IconAlertCircle />
      </ThemeIcon>
    </Tooltip>
  );
}

type ManagePaymentsButtonProps = {
  membershipId: bigint;
};

export default function ManagePaymentsButton({
  membershipId,
  ...props
}: ManagePaymentsButtonProps & GroupProps) {
  const createCustomerPortalSession =
    api.payments.createCustomerPortalSession.useMutation({
      onSuccess: (r) => {
        window.location.href = r.redirectUrl;
      },
      onError: (e) => {
        logger.error(e, "failed to create customer portal session");
      }
    });

  return (
    <Group gap={"xs"} {...props}>
      <Button
        onClick={async () => {
          await createCustomerPortalSession.mutateAsync({
            input: { origin: window.location.origin },
            membershipId: membershipId.toString()
          });
        }}
        loading={createCustomerPortalSession.isPending}
      >
        Manage Payments
      </Button>
      <SubscriptionUpdateWarning />
    </Group>
  );
}
