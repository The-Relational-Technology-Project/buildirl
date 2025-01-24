"use client";

import { api } from "~/trpc/react";
import { Stack, Tabs, Title } from "@mantine/core";
import React from "react";
import { useParams } from "next/navigation";
import { QueryError } from "~/client/utils/QueryError";
import { isLoaded } from "~/client/utils";
import { OverviewPanel } from "~/client/components/OverviewPanel";

export default function ManageClub() {
  const params = useParams<{ clubId: string }>();
  const userId = parseInt(params.clubId);

  const r = api.main.club.useQuery({ id: userId });

  QueryError.check({
    result: r,
    fieldName: "club"
  });

  return (
    isLoaded(r) && (
      <Stack pt={"xl"} style={{ borderWidth: 1, borderColor: "black" }}>
        <Title order={2}>{r.data!.name}</Title>

        <Tabs color={"gray"} radius={"xs"} defaultValue={"overview"}>
          <Tabs.List>
            <Tabs.Tab value={"overview"}>Overview</Tabs.Tab>
            <Tabs.Tab value={"intake"}>Intake</Tabs.Tab>
            <Tabs.Tab value={"memberships"}>Memberships</Tabs.Tab>
            <Tabs.Tab value={"people"}>People</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value={"overview"}>
            <OverviewPanel club={r.data!} />
          </Tabs.Panel>
          <Tabs.Panel value={"intake"}>
            <></>
          </Tabs.Panel>
          <Tabs.Panel value={"memberships"}>
            <></>
          </Tabs.Panel>
          <Tabs.Panel value={"people"}>
            <></>
          </Tabs.Panel>
        </Tabs>
      </Stack>
    )
  );
}
