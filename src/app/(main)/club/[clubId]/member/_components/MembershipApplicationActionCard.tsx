import { Membership } from "~/server/membership/types";
import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";
import { handleDefaultMutationError } from "~/client/logger";
import { Button, Group, Paper, Stack, Text, Title } from "@mantine/core";
import React from "react";

type MembershipApplicationActionCardProps = {
  clubId: number;
  membership: Membership;
};

export default function MembershipApplicationActionCard({
  clubId,
  membership
}: MembershipApplicationActionCardProps) {
  const utils = api.useUtils();
  const router = useRouter();

  const approveMembershipApplication =
    api.main.approveMembershipApplication.useMutation({
      onSuccess: async () => {
        await utils.main.membershipApplicationsForClub.invalidate({ clubId });
        await utils.main.activeMembershipsForClubWithEmail.invalidate({
          clubId
        });
        await utils.main.activeMembershipsForClub.invalidate({
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
            disabled={declineMembershipApplication.isPending}
          >
            Approve
          </Button>
          <Button
            color="red"
            size="sm"
            onClick={handleDeclineMembership}
            loading={declineMembershipApplication.isPending}
            disabled={approveMembershipApplication.isPending}
          >
            Decline
          </Button>
        </Group>
      </Stack>
    </Paper>
  );
}
