import { ThemeIcon, Tooltip } from "@mantine/core";
import { api } from "~/trpc/react";
import { QueryError } from "~/client/utils/QueryError";
import { isLoaded } from "~/client/utils";
import { IconAlertCircle } from "@tabler/icons-react";
import React from "react";

type InactiveSubscriptionAlertProps = {
  membershipId: bigint;
  forClubOwner?: boolean;
};

export default function InactiveSubscriptionAlert({
  membershipId,
  forClubOwner = false
}: InactiveSubscriptionAlertProps) {
  const r = api.payments.subscriptionStatus.useQuery(
    { membershipId: membershipId.toString() },
    {
      // refetch every 5 minute as data can be changed externally in Stripe
      refetchInterval: 5 * 60 * 1000
    }
  );

  QueryError.checkNullable({
    result: r,
    fieldName: "subscriptionStatus"
  });

  if (!isLoaded(r)) {
    return;
  }

  // active subscription requires no warning
  if (r.data !== null && r.data!.isActive) {
    return;
  }

  return (
    <Tooltip
      label={
        r.data === null
          ? "Subscription is not set up. This is not expected, please contact support."
          : `Subscription is inactive with status '${r.data!.status}'. ${
              forClubOwner
                ? "Please contact member to fix or cancel membership."
                : "Please fix in Stripe customer portal or cancel your membership."
            }`
      }
      position="right"
    >
      <ThemeIcon size={"sm"} color="red">
        <IconAlertCircle />
      </ThemeIcon>
    </Tooltip>
  );
}
