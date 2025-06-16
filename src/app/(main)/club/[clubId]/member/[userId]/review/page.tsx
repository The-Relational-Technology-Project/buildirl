"use client";

import { useParams, useRouter } from "next/navigation";
import { strictParseInt } from "~/utils";
import WithLocalNavigationHeader from "~/client/components/WithLocalNavigationHeader";
import React from "react";
import { Button, Group, Paper, Stack, Text, Title } from "@mantine/core";
import { api } from "~/trpc/react";
import { QueryError } from "~/client/utils/QueryError";
import { isAllLoaded } from "~/client/utils";
import { Membership } from "~/server/membership/types";
import { handleDefaultMutationError } from "~/client/logger";
import { Maybe } from "~/utils/types";
import MembershipInfoCard from "~/app/(main)/club/[clubId]/member/_components/MembershipInfoCard";
import UserInfoCard from "~/app/(main)/club/[clubId]/member/_components/UserInfoCard";
import ApplicationResponsesCard from "~/client/components/ApplicationResponsesCard";

function findUserMembership(
  userId: number,
  membershipApplications: Membership[],
  activeMemberships: Membership[]
): Maybe<Membership> {
  return (
    [...membershipApplications, ...activeMemberships].find(
      (mem) => mem.user.id === userId
    ) || null
  );
}

type PendingMembershipCardProps = {
  clubId: number;
  membership: Membership;
};

function PendingMembershipCard({
  clubId,
  membership
}: PendingMembershipCardProps) {
  const utils = api.useUtils();
  const router = useRouter();

  const approveMembershipApplication =
    api.main.approveMembershipApplication.useMutation({
      onSuccess: async () => {
        await utils.main.membershipApplicationsForClub.invalidate({ clubId });
        await utils.main.activeMembershipsForClubWithEmail.invalidate({
          clubId
        });
        await utils.main.clubStatistics.invalidate({ clubId });
        router.push(`/club/${clubId}/manage?tab=people`);
      },
      onError: handleDefaultMutationError
    });

  const declineMembershipApplication =
    api.main.declineMembershipApplication.useMutation({
      onSuccess: async () => {
        await utils.main.membershipApplicationsForClub.invalidate({ clubId });
        router.push(`/club/${clubId}/manage?tab=people`);
      },
      onError: handleDefaultMutationError
    });

  const handleApproveMembership = async () => {
    if (
      window.confirm(
        "Ready to approve this application? Don't forget to review the application intake form before approving."
      )
    ) {
      await approveMembershipApplication.mutateAsync({
        membershipId: membership.id
      });
    }
  };

  const handleDeclineMembership = async () => {
    if (
      window.confirm(
        "Are you sure you want to decline this application? This action cannot be undone."
      )
    ) {
      await declineMembershipApplication.mutateAsync({
        membershipId: membership.id
      });
    }
  };

  return (
    <Paper p="xl">
      <Stack gap="lg">
        <Title order={4} fw={500}>
          Actions
        </Title>
        <Text size="sm">
          Review this application and decide whether to approve or decline
          membership.
        </Text>
        <Group grow>
          <Button
            color="green"
            size="sm"
            onClick={handleApproveMembership}
            loading={approveMembershipApplication.isPending}
          >
            Approve
          </Button>
          <Button
            color="red"
            size="sm"
            onClick={handleDeclineMembership}
            loading={declineMembershipApplication.isPending}
          >
            Decline
          </Button>
        </Group>
      </Stack>
    </Paper>
  );
}

type ActiveMembershipCardProps = {
  clubId: number;
  membership: Membership;
};

function ActiveMembershipCard({
  clubId,
  membership
}: ActiveMembershipCardProps) {
  const utils = api.useUtils();
  const router = useRouter();

  const deactivateMembership = api.main.deactivateMembership.useMutation({
    onSuccess: async () => {
      await utils.main.activeMembershipsForClubWithEmail.invalidate({ clubId });
      await utils.main.clubStatistics.invalidate({ clubId });
      router.push(`/club/${clubId}/manage?tab=people`);
    },
    onError: handleDefaultMutationError
  });

  const handleCancelMembership = () => {
    if (
      window.confirm(
        "Are you sure you want to cancel this membership? This action cannot be undone."
      )
    ) {
      deactivateMembership.mutateAsync({
        membershipId: membership.id,
        input: { byClubLead: true }
      });
    }
  };

  return (
    <Paper p="xl">
      <Stack gap="lg">
        <Title order={4} fw={500}>
          Actions
        </Title>
        <Text size="sm">
          This member is currently active. You can cancel their membership if
          needed.
        </Text>
        <Button
          color="red"
          size="sm"
          onClick={handleCancelMembership}
          loading={deactivateMembership.isPending}
        >
          Cancel Membership
        </Button>
      </Stack>
    </Paper>
  );
}

export default function MemberReview() {
  const params = useParams<{ userId: string; clubId: string }>();
  const userId = strictParseInt(params.userId);
  const clubId = strictParseInt(params.clubId);

  const membershipApplications =
    api.main.membershipApplicationsForClub.useQuery({ clubId });
  const activeMemberships = api.main.activeMembershipsForClubWithEmail.useQuery(
    { clubId }
  );
  const userQuery = api.main.userById.useQuery({ id: userId });

  QueryError.check({
    result: membershipApplications,
    fieldName: "membershipApplicationsForClub"
  });
  QueryError.check({
    result: activeMemberships,
    fieldName: "activeMembershipsForClubWithEmail"
  });
  QueryError.check({
    result: userQuery,
    fieldName: "userById"
  });

  if (!isAllLoaded([membershipApplications, activeMemberships, userQuery])) {
    return null;
  }

  const userMembership = findUserMembership(
    userId,
    membershipApplications.data!,
    activeMemberships.data!
  );

  const pendingMembership = membershipApplications.data!.find(
    (mem) => mem.user.id === userId
  );
  const activeMembership = activeMemberships.data!.find(
    (mem) => mem.user.id === userId
  );

  if (!userMembership) {
    return null;
  }

  return (
    <WithLocalNavigationHeader>
      {/* include this at the top so the reviewer does not miss it */}
      <Stack gap="xl" pb="xl">
        {pendingMembership && (
          <PendingMembershipCard
            clubId={clubId}
            membership={pendingMembership}
          />
        )}

        <UserInfoCard user={userQuery.data!} />

        <MembershipInfoCard membership={userMembership} />

        <ApplicationResponsesCard membership={userMembership} />

        {activeMembership && (
          <ActiveMembershipCard clubId={clubId} membership={activeMembership} />
        )}
      </Stack>
    </WithLocalNavigationHeader>
  );
}
