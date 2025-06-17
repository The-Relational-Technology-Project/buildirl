import { Membership } from "~/server/membership/types";
import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";
import { handleDefaultMutationError } from "~/client/logger";
import { Button, Divider, Paper, Stack, Text, Title } from "@mantine/core";
import React from "react";

type GrantLeadRoleSectionProps = {
  clubId: number;
  membership: Membership;
};

function GrantLeadRoleSection({
  clubId,
  membership
}: GrantLeadRoleSectionProps) {
  const utils = api.useUtils();

  const setMembershipAsLead = api.main.setMembershipAsLead.useMutation({
    onSuccess: async () => {
      await utils.main.activeMembershipsForClubWithEmail.invalidate({ clubId });
      await utils.main.activeMembershipsForClub.invalidate({
        clubId
      });
    },
    onError: handleDefaultMutationError
  });

  const handleSetMembershipAsLead = () => {
    if (
      window.confirm(
        "Are you sure you want to grant this member a lead role? This will give them access to the club management " +
          "dashboard and all of its capabilities."
      )
    ) {
      setMembershipAsLead.mutateAsync({
        membershipId: membership.id
      });
    }
  };

  return (
    <Stack gap={"lg"}>
      <Text size="sm">
        You can grant this member a lead role. This will give them access to the
        club management dashboard and all of its capabilities.
      </Text>
      <Button
        color="orange"
        size="sm"
        onClick={handleSetMembershipAsLead}
        loading={setMembershipAsLead.isPending}
      >
        Grant Lead Role
      </Button>
    </Stack>
  );
}

type RevokeLeadRoleSectionProps = {
  clubId: number;
  membership: Membership;
};

function RevokeLeadRoleSection({
  clubId,
  membership
}: RevokeLeadRoleSectionProps) {
  const utils = api.useUtils();

  const clearMembershipRole = api.main.clearMembershipRole.useMutation({
    onSuccess: async () => {
      await utils.main.activeMembershipsForClubWithEmail.invalidate({ clubId });
      await utils.main.activeMembershipsForClub.invalidate({
        clubId
      });
      // it is likely this is for the current lead user
      await utils.main.userMemberships.invalidate();
    },
    onError: handleDefaultMutationError
  });

  const handleClearMembershipRole = () => {
    if (
      window.confirm(
        "Are you sure you want to revoke the lead role for this member? This will remove their access to the club management " +
          "dashboard and all of its capabilities."
      )
    ) {
      clearMembershipRole.mutateAsync({
        membershipId: membership.id
      });
    }
  };

  return (
    <Stack gap={"lg"}>
      <Text size="sm">
        You can revoke the lead role for this member. This will remove their
        access to the club management dashboard and all of its capabilities.
      </Text>
      <Button
        color="grey"
        size="sm"
        onClick={handleClearMembershipRole}
        loading={clearMembershipRole.isPending}
      >
        Revoke Lead Role
      </Button>
    </Stack>
  );
}

type ToggleMembershipLeadRoleSectionProps = {
  clubId: number;
  membership: Membership;
};

function ToggleMembershipLeadRoleSection({
  clubId,
  membership
}: ToggleMembershipLeadRoleSectionProps) {
  if (membership.role === "LEAD") {
    return <RevokeLeadRoleSection clubId={clubId} membership={membership} />;
  }
  return <GrantLeadRoleSection clubId={clubId} membership={membership} />;
}

type DeactivateMembershipSectionProps = {
  clubId: number;
  membership: Membership;
};

function DeactivateMembershipSection({
  clubId,
  membership
}: DeactivateMembershipSectionProps) {
  const utils = api.useUtils();
  const router = useRouter();

  const deactivateMembership = api.main.deactivateMembership.useMutation({
    onSuccess: async () => {
      await utils.main.activeMembershipsForClubWithEmail.invalidate({ clubId });
      await utils.main.activeMembershipsForClub.invalidate({
        clubId
      });
      await utils.main.clubStatistics.invalidate({ clubId });
      // did not invalidate userMembership as the edge case that user is deactivating
      // themselves here is a small one
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
    <Stack gap={"lg"}>
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
  );
}

type ActiveMembershipCardProps = {
  clubId: number;
  membership: Membership;
};

export default function ActiveMembershipCard({
  clubId,
  membership
}: ActiveMembershipCardProps) {
  return (
    <Paper p="xl">
      <Stack gap="lg">
        <Title order={4} fw={500}>
          Actions
        </Title>
        <ToggleMembershipLeadRoleSection
          clubId={clubId}
          membership={membership}
        />
        <Divider />
        <DeactivateMembershipSection clubId={clubId} membership={membership} />
      </Stack>
    </Paper>
  );
}
