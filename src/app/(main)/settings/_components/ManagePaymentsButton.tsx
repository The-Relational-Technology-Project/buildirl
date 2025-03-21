import { Button, Group, GroupProps, ThemeIcon, Tooltip } from "@mantine/core";
import React from "react";
import { api } from "~/trpc/react";
import { QueryError } from "~/client/utils/QueryError";
import { isLoaded } from "~/client/utils";
import { IconAlertCircle } from "@tabler/icons-react";

function SubscriptionUpdateWarning() {
  return (
    <Tooltip
      multiline
      w={300}
      label="While the Stripe dashboard allows you to cancel and pause your subscription directly, this is not recommended.
      Club owners are notified of inactive subscriptions. If you wish to cancel your membership and subscription,
      please leave the club through membership management."
      position="right-start"
    >
      <ThemeIcon color={"gray"} size={"sm"}>
        <IconAlertCircle />
      </ThemeIcon>
    </Tooltip>
  );
}

export default function ManagePaymentsButton({ ...props }: GroupProps) {
  const r = api.payments.customerPortalLink.useQuery();

  QueryError.checkNullable({
    result: r,
    fieldName: "customerPortalLink"
  });

  return (
    isLoaded(r) && (
      <Group gap={"xs"} {...props}>
        <Button component="a" href={r.data!} target="_blank">
          Manage Payments
        </Button>
        <SubscriptionUpdateWarning />
      </Group>
    )
  );
}
