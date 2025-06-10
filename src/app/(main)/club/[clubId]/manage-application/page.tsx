"use client";

import { useParams, useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { QueryError } from "~/client/utils/QueryError";
import { isLoaded } from "~/client/utils";
import React from "react";
import WithLocalNavigationHeader from "~/client/components/WithLocalNavigationHeader";
import { membershipForClub } from "~/utils/types";
import { handleDefaultMutationError } from "~/client/logger";
import { strictParseInt } from "~/utils";
import MembershipInfoCard from "~/app/(main)/club/[clubId]/member/_components/MembershipInfoCard";
import { 
  Button, 
  Stack, 
  Title, 
  Paper, 
  Text
} from "@mantine/core";
import { Membership } from "~/server/membership/types";
import ApplicationResponsesCard from "~/client/components/ApplicationResponsesCard";



function WithdrawApplicationSection({ membership }: { membership: Membership }) {
  const router = useRouter();
  const utils = api.useUtils();
  
  const withdrawMembership = api.main.withdrawMembershipApplication.useMutation({
    onSuccess: async () => {
      await utils.main.userMemberships.invalidate();
      router.push(`/join/${membership.club.publicId}`);
    },
    onError: handleDefaultMutationError
  });

  const handleWithdraw = () => {
    if (
      window.confirm(
        "Are you sure you want to withdraw your application? This action cannot be undone and you will need to submit a new application if you wish to join the club."
      )
    ) {
      withdrawMembership.mutate({ membershipId: membership.id });
    }
  };

  return (
    <Paper p={"xl"}>
      <Stack gap="lg">
        <Title order={4} fw={500}>
          Actions
        </Title>
        <Text size="sm">
          If you no longer wish to join this club, you can withdraw your application below.
        </Text>
        <Button
          color="red"
          size="sm"
          onClick={handleWithdraw}
          loading={withdrawMembership.isPending}
        >
          Withdraw
        </Button>
      </Stack>
    </Paper>
  );
}

export default function ManageApplication() {
  const params = useParams<{ clubId: string }>();
  const clubId = strictParseInt(params.clubId);

  const userMemberships = api.main.userMemberships.useQuery();

  QueryError.check({
    result: userMemberships,
    fieldName: "userMemberships"
  });

  if (!isLoaded(userMemberships)) {
    return null;
  }

  const membership = membershipForClub(userMemberships.data!, clubId);

  if (!membership) {
    throw new Error(`No membership found for club ${clubId}`);
  }

  if (membership.status !== "PENDING") {
    throw new Error(`Membership for club ${clubId} must be PENDING, but was ${membership.status}`);
  }

  const club = membership.club;

  return (
    <WithLocalNavigationHeader navigateTo={`/join/${club.publicId}`}>
      <Stack gap="xl" pb="xl">
        <Title order={2} ta="center">
          Manage Your {club.name} Application
        </Title>

        <MembershipInfoCard membership={membership} />

        <ApplicationResponsesCard membership={membership} />

        <WithdrawApplicationSection membership={membership} />
      </Stack>
    </WithLocalNavigationHeader>
  );
} 