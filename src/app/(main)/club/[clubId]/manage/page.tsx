"use client";

import { api } from "~/trpc/react";
import { Box, Stack, Tabs, Title } from "@mantine/core";
import React from "react";
import { useParams } from "next/navigation";
import { QueryError } from "~/client/utils/QueryError";
import { isLoaded } from "~/client/utils";
import { ClubOverviewPanel } from "~/app/(main)/club/[clubId]/manage/_components/ClubOverviewPanel";
import { ClubAdminPanel } from "~/app/(main)/club/[clubId]/manage/_components/ClubAdminPanel";
import { ManageMembershipTiersPanel } from "~/app/(main)/club/[clubId]/manage/_components/ManageMembershipTiersPanel";
import { strictParseInt } from "~/utils";
import { MembershipApplicationTable } from "~/app/(main)/club/[clubId]/manage/_components/MembershipApplicationTable";
import { ActiveMembershipTable } from "~/app/(main)/club/[clubId]/manage/_components/ActiveMembershipTable";
import { ManageIntakePanel } from "~/app/(main)/club/[clubId]/manage/_components/ManageIntakePanel";

export default function ManageClub() {
  const params = useParams<{ clubId: string }>();
  const clubId = strictParseInt(params.clubId);

  const r = api.main.club.useQuery({ id: clubId });

  QueryError.check({
    result: r,
    fieldName: "club"
  });

  return (
    isLoaded(r) && (
      <Stack pt={"xl"}>
        <Title order={2}>{r.data!.name}</Title>

        <Tabs color={"gray"} defaultValue={"overview"}>
          <Box style={{ overflowX: "auto" }}>
            <Tabs.List style={{ flexWrap: "nowrap" }}>
              <Tabs.Tab value={"overview"}>Club Overview</Tabs.Tab>
              <Tabs.Tab value={"memberships"}>Membership Tiers</Tabs.Tab>
              <Tabs.Tab value={"people"}>People</Tabs.Tab>
              <Tabs.Tab value={"intake"}>Intake</Tabs.Tab>
              <Tabs.Tab value={"admin"}>Admin</Tabs.Tab>
            </Tabs.List>
          </Box>

          <Tabs.Panel value={"overview"}>
            <ClubOverviewPanel club={r.data!} />
          </Tabs.Panel>
          <Tabs.Panel value={"memberships"}>
            <ManageMembershipTiersPanel club={r.data!} />
          </Tabs.Panel>
          <Tabs.Panel value={"people"}>
            <ManagePeoplePanel clubId={r.data!.id} />
          </Tabs.Panel>
          <Tabs.Panel value={"intake"}>
            <ManageIntakePanel club={r.data!} />
          </Tabs.Panel>
          <Tabs.Panel value={"admin"}>
            <ClubAdminPanel clubId={r.data!.id} />
          </Tabs.Panel>
        </Tabs>
      </Stack>
    )
  );
}

type ManagePeoplePanelProps = {
  clubId: number;
};

function ManagePeoplePanel({ clubId }: ManagePeoplePanelProps) {
  return (
    <Stack gap={0} pb={"xl"}>
      <MembershipApplicationTable clubId={clubId} />
      <ActiveMembershipTable clubId={clubId} />
    </Stack>
  );
}
