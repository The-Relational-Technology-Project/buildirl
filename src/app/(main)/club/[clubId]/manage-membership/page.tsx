"use client";

import { Button, Stack, Title, Text, Paper, Group } from "@mantine/core";
import { useParams, useRouter } from "next/navigation";
import { strictParseInt } from "~/utils";
import { api } from "~/trpc/react";
import { QueryError } from "~/client/utils/QueryError";
import { isLoaded } from "~/client/utils";
import React from "react";
import WithLocalNavigationHeader from "~/client/components/WithLocalNavigationHeader";
import { isDefaultFreeTier, membershipForClub } from "~/utils/types";
import InactiveSubscriptionAlert from "~/client/components/InactiveSubscriptionAlert";
import ManagePaymentsButton from "~/app/(main)/club/[clubId]/manage-membership/_components/ManagePaymentsButton";
import { handleDefaultMutationError } from "~/client/logger";

export default function ManageMembership() {
  const params = useParams<{ clubId: string }>();
  const clubId = strictParseInt(params.clubId);
  const router = useRouter();

  const userMemberships = api.main.userMemberships.useQuery();

  const utils = api.useUtils();
  const deactivateMembership = api.main.deactivateMembership.useMutation({
    onSuccess: async () => {
      await utils.main.userMemberships.invalidate();
      await utils.main.activeMembershipsForClub.invalidate({ clubId: clubId });
      await utils.main.activeMembershipsForClubWithEmail.invalidate({
        clubId: clubId
      });
      await utils.main.clubStatistics.invalidate({ clubId: clubId });
      router.push("/");
    },
    onError: handleDefaultMutationError
  });

  QueryError.check({
    result: userMemberships,
    fieldName: "userMemberships"
  });

  if (!isLoaded(userMemberships)) {
    return null;
  }

  const membership = membershipForClub(userMemberships.data!, clubId);
  if (null === membership || membership.status != "ACTIVE") {
    // we don't error here but return null page because this page
    // gets rehydrated after deactivate membership before the router.back()
    // is completed
    return null;
  }

  const handleDeactivateMembership = () => {
    if (
      window.confirm(
        "Are you sure you want to leave this club? You will need to reapply if you want to join again."
      )
    ) {
      deactivateMembership.mutateAsync({
        membershipId: membership.id,
        input: { byClubOwner: false }
      });
    }
  };

  return (
    // go back explicitly to root because we might have gone
    // to Stripe and do not want to redirect back there
    <WithLocalNavigationHeader navigateTo={"/"}>
      <Stack>
        <Title order={3}>Your Membership to {membership.club.name}</Title>
        <Paper p={"xl"}>
          <Group gap={"xs"}>
            <Title order={4}>Membership Details</Title>
            {!isDefaultFreeTier(membership.membershipTier) && (
              <InactiveSubscriptionAlert membershipId={membership.id} />
            )}
          </Group>

          <Stack gap={2} mt={"md"}>
            <Title order={5}>Name</Title>
            <Text size={"sm"}>{membership.membershipTier.name}</Text>
            {membership.membershipTier.benefitDescription !== "" && (
              <>
                <Title order={5} mt={"sm"}>
                  Your Benefits
                </Title>
                <Text size={"sm"}>
                  {membership.membershipTier.benefitDescription}
                </Text>
              </>
            )}
            {membership.membershipTier.contributionDescription !== "" && (
              <>
                <Title order={5} mt={"sm"}>
                  Your Contributions
                </Title>
                <Text size={"sm"}>
                  {membership.membershipTier.contributionDescription}
                </Text>
              </>
            )}

            <Title order={5} mt={"sm"}>
              Cost
            </Title>
            <Text
              size={"sm"}
            >{`$${membership.membershipTier.costPerMonthInUSD}.00/month`}</Text>

            {!isDefaultFreeTier(membership.membershipTier) && (
              <ManagePaymentsButton membershipId={membership.id} mt={"lg"} />
            )}
          </Stack>
        </Paper>

        <Stack w={"100%"} align={"center"} mt={"md"}>
          <Button
            w={180}
            color={"red"}
            onClick={handleDeactivateMembership}
            loading={deactivateMembership.isPending}
          >
            Cancel Membership
          </Button>
          <Text size={"sm"} w={360} style={{ textAlign: "center" }}>
            Your membership will be canceled at the end of this billing period.
            You will not be charged going forward if you decide to leave.
            Re-joining will require you to re-apply.
          </Text>
        </Stack>
      </Stack>
    </WithLocalNavigationHeader>
  );
}
