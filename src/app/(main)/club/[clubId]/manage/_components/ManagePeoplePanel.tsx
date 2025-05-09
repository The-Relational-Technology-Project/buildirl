import { Stack } from "@mantine/core";
import MembershipApplicationTable from "~/app/(main)/club/[clubId]/manage/_components/MembershipApplicationTable";
import ActiveMembershipTable from "~/app/(main)/club/[clubId]/manage/_components/ActiveMembershipTable";
import ClubFollowerTable from "~/app/(main)/club/[clubId]/manage/_components/ClubFollowerTable";
import React from "react";

type ManagePeoplePanelProps = {
  clubId: number;
};

export function ManagePeoplePanel({ clubId }: ManagePeoplePanelProps) {
  return (
    <Stack gap={0} pb={"xl"}>
      <MembershipApplicationTable clubId={clubId} />
      <ActiveMembershipTable clubId={clubId} />
      <ClubFollowerTable clubId={clubId} />
    </Stack>
  );
}
