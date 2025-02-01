"use client";

import { api } from "~/trpc/react";
import { Box, Stack, Tabs, Title } from "@mantine/core";
import React from "react";
import { useParams } from "next/navigation";
import { QueryError } from "~/client/utils/QueryError";
import { isLoaded } from "~/client/utils";
import { ClubOverviewPanel } from "~/client/components/ClubOverviewPanel";
import { ClubAdminPanel } from "~/client/components/ClubAdminPanel";
import { ManageMembershipTiersPanel } from "~/client/components/ManageMembershipTiersPanel";
import { strictParseInt } from "~/utils";
import { MembershipApplicationTable } from "~/client/components/MembershipApplicationTable";

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
            <></>
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
    <Stack>
      <MembershipApplicationTable clubId={clubId} />
    </Stack>
  );
}
