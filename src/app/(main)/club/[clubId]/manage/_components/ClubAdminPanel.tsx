import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { Alert, Button, Stack, Text } from "@mantine/core";
import React from "react";
import { isAllLoaded } from "~/client/utils";
import { QueryError } from "~/client/utils/QueryError";
import { handleDefaultMutationError } from "~/client/logger";

type ClubAdminPanelProps = {
  clubId: number;
};

export default function ClubAdminPanel({ clubId }: ClubAdminPanelProps) {
  const router = useRouter();
  const utils = api.useUtils();

  const deleteClubMutation = api.main.deleteClub.useMutation({
    onSuccess: () => {
      router.push("/");
      utils.main.userMemberships.invalidate();
    },
    onError: handleDefaultMutationError
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

  const hasMoreThanOneActiveOrAnyPendingMemberships =
    // allow one remaining lead member
    r.data!.length > 1 || m.data!.length > 0;

  const handleDeleteClub = () => {
    if (
      window.confirm(
        "Are you sure you want to delete this club? This action cannot be undone."
      )
    ) {
      // TODO delete club should also delete assets in bucket
      deleteClubMutation.mutate({ id: clubId });
    }
  };

  return (
    <Stack gap="sm" mt="md" align={"center"}>
      <Alert color="red" title="Danger Zone">
        Deleting a club is an irreversible action. You can only delete a club if
        there are no additional active memberships or pending applications.
      </Alert>

      <Button
        color="red"
        mt={"sm"}
        w={150}
        disabled={hasMoreThanOneActiveOrAnyPendingMemberships}
        onClick={handleDeleteClub}
        loading={deleteClubMutation.isPending}
      >
        Delete Club
      </Button>
      {hasMoreThanOneActiveOrAnyPendingMemberships && (
        <Text c={"dimmed"} size={"sm"}>
          You cannot delete this club while it has additional active memberships
          or pending applications.
        </Text>
      )}
    </Stack>
  );
}
