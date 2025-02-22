"use client";

import { api } from "~/trpc/react";
import {
  Divider,
  Stack,
  Tabs,
  Title,
  useMantineColorScheme,
  useMantineTheme
} from "@mantine/core";
import React from "react";
import { useParams } from "next/navigation";
import { QueryError } from "~/client/utils/QueryError";
import { isLoaded } from "~/client/utils";
import ClubOverviewPanel from "~/app/(main)/club/[clubId]/manage/_components/ClubOverviewPanel";
import ClubAdminPanel from "~/app/(main)/club/[clubId]/manage/_components/ClubAdminPanel";
import ManageMembershipTiersPanel from "~/app/(main)/club/[clubId]/manage/_components/ManageMembershipTiersPanel";
import { strictParseInt } from "~/utils";
import MembershipApplicationTable from "~/app/(main)/club/[clubId]/manage/_components/MembershipApplicationTable";
import ActiveMembershipTable from "~/app/(main)/club/[clubId]/manage/_components/ActiveMembershipTable";
import ManageIntakePanel from "~/app/(main)/club/[clubId]/manage/_components/ManageIntakePanel";
import { useMounted } from "@mantine/hooks";

export default function ManageClub() {
  const { colorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();
  const mounted = useMounted();

  const params = useParams<{ clubId: string }>();
  const clubId = strictParseInt(params.clubId);

  const r = api.main.club.useQuery({ id: clubId });

  QueryError.check({
    result: r,
    fieldName: "club"
  });

  return (
    mounted &&
    isLoaded(r) && (
      <Stack pt={"xl"}>
        <Title order={2}>{r.data!.name}</Title>

        <Tabs
          // hacky but how we support dark mode with defaults
          color={colorScheme === "dark" ? theme.colors.dark[4] : undefined}
          defaultValue={"overview"}
        >
          <Tabs.List>
            <Tabs.Tab value={"overview"}>Club Overview</Tabs.Tab>
            <Tabs.Tab value={"memberships"}>Membership Tiers</Tabs.Tab>
            <Tabs.Tab value={"people"}>People</Tabs.Tab>
            <Tabs.Tab value={"intake"}>Intake</Tabs.Tab>
            <Tabs.Tab value={"admin"}>Admin</Tabs.Tab>
          </Tabs.List>

          <Divider />

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
