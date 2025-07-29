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
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { QueryError } from "~/client/utils/QueryError";
import { isLoaded } from "~/client/utils";
import ClubOverviewPanel from "~/app/(main)/club/[clubId]/manage/_components/ClubOverviewPanel";
import ClubAdminPanel from "~/app/(main)/club/[clubId]/manage/_components/ClubAdminPanel";
import ManageMembershipTiersPanel from "~/app/(main)/club/[clubId]/manage/_components/ManageMembershipTiersPanel";
import { strictParseInt } from "~/utils";
import ManageIntakePanel from "~/app/(main)/club/[clubId]/manage/_components/ManageIntakePanel";
import { useMounted } from "@mantine/hooks";
import StripeConnectPanel from "~/app/(main)/club/[clubId]/manage/_components/StripeConnectPanel";
import { ManagePeoplePanel } from "~/app/(main)/club/[clubId]/manage/_components/ManagePeoplePanel";
import CommunicationOverviewPanel from "~/app/(main)/club/[clubId]/manage/_components/CommunicationOverviewPanel";

export default function ManageClub() {
  const { colorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();
  const mounted = useMounted();

  const router = useRouter();
  const params = useParams<{ clubId: string }>();
  const clubId = strictParseInt(params.clubId);
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") ?? "overview";

  const club = api.main.club.useQuery({ id: clubId });

  QueryError.check({
    result: club,
    fieldName: "club"
  });

  return (
    mounted &&
    isLoaded(club) && (
      <Stack pt={"xl"}>
        <Title order={2}>{club.data!.name} Dashboard</Title>

        <Tabs
          // hacky but how we support dark mode with defaults
          color={colorScheme === "dark" ? theme.colors.dark[4] : undefined}
          value={activeTab}
          onChange={(value) => {
            // change url without scrolling page to top
            router.push(`?tab=${value}`, { scroll: false });
          }}
        >
          <Tabs.List>
            <Tabs.Tab value={"overview"}>Club Overview</Tabs.Tab>
            <Tabs.Tab value={"memberships"}>Membership Tiers</Tabs.Tab>
            <Tabs.Tab value={"intake"}>Intake Form</Tabs.Tab>
            <Tabs.Tab value={"people"}>People</Tabs.Tab>
            <Tabs.Tab value={"email"}>Communication</Tabs.Tab>
            <Tabs.Tab value={"stripe-connect"}>Stripe Connect</Tabs.Tab>
            <Tabs.Tab value={"admin"}>Admin</Tabs.Tab>
          </Tabs.List>

          <Divider />

          <Tabs.Panel value={"overview"}>
            <ClubOverviewPanel club={club.data!} />
          </Tabs.Panel>
          <Tabs.Panel value={"memberships"}>
            <ManageMembershipTiersPanel club={club.data!} />
          </Tabs.Panel>
          <Tabs.Panel value={"intake"}>
            <ManageIntakePanel club={club.data!} />
          </Tabs.Panel>
          <Tabs.Panel value={"people"}>
            <ManagePeoplePanel clubId={club.data!.id} />
          </Tabs.Panel>
          <Tabs.Panel value={"email"}>
            <CommunicationOverviewPanel clubId={club.data!.id} />
          </Tabs.Panel>
          <Tabs.Panel value={"stripe-connect"}>
            <StripeConnectPanel clubId={club.data!.id} />
          </Tabs.Panel>
          <Tabs.Panel value={"admin"}>
            <ClubAdminPanel clubId={club.data!.id} />
          </Tabs.Panel>
        </Tabs>
      </Stack>
    )
  );
}
