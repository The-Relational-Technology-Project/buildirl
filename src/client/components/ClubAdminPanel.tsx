import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { Alert, Button, Stack, Text } from "@mantine/core";
import React from "react";
import { isAllLoaded } from "~/client/utils";
import { QueryError } from "~/client/utils/QueryError";

type ClubAdminPanelProps = {
  clubId: number;
};

export function ClubAdminPanel({ clubId }: ClubAdminPanelProps) {
  const router = useRouter();
  const utils = api.useUtils();

  const deleteClubMutation = api.main.deleteClub.useMutation({
    onSuccess: () => {
      router.push("/");
      utils.main.userOwnedClubs.invalidate();
    }
  });

  const r = api.main.activeMembershipsForClub.useQuery({
    clubId: clubId
  });
  const m = api.main.membershipApplicationsForClub.useQuery({
    clubId: clubId
  });

  QueryError.check({
    result: r,
    fieldName: "activeMembershipsForClub"
  });
  QueryError.check({
    result: r,
    fieldName: "membershipApplicationsForClub"
  });

  if (!isAllLoaded([r, m])) {
    return null;
  }

  const hasActiveOrPendingMemberships =
    r.data!.length > 0 || m.data!.length > 0;

  const handleDeleteClub = () => {
    if (
      window.confirm(
        "Are you sure you want to delete this club? This action cannot be undone."
      )
    ) {
      deleteClubMutation.mutate({ id: clubId });
    }
  };

  return (
    <Stack gap="sm" mt="md" align={"center"}>
      <Alert color="red" title="Danger Zone">
        Deleting a club is an irreversible action. You can only delete a club if
        there are no active memberships or pending applications.
      </Alert>

      <Button
        color="red"
        mt={"sm"}
        w={150}
        disabled={hasActiveOrPendingMemberships}
        onClick={handleDeleteClub}
        loading={deleteClubMutation.isPending}
      >
        Delete Club
      </Button>
      {hasActiveOrPendingMemberships && (
        <Text c={"dimmed"} size={"sm"}>
          You cannot delete this club while it has active memberships or pending
          applications.
        </Text>
      )}
    </Stack>
  );
}
