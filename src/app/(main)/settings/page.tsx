"use client";

import {
  Stack,
  Title,
  Tabs,
  Divider,
  useMantineColorScheme,
  useMantineTheme
} from "@mantine/core";
import React from "react";
import { useMounted } from "@mantine/hooks";
import EditProfilePanel from "~/app/(main)/settings/_components/EditProfilePanel";
import StripeConnectPanel from "~/app/(main)/settings/_components/StripeConnectPanel";
import { useRouter, useSearchParams } from "next/navigation";

export default function Settings() {
  const { colorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();
  const mounted = useMounted();

  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") ?? "profile";

  return (
    mounted && (
      <Stack pt={"xl"}>
        <Title order={2}>Settings</Title>

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
            <Tabs.Tab value={"profile"}>Edit Profile</Tabs.Tab>
            <Tabs.Tab value={"connect"}>Stripe Connect</Tabs.Tab>
            <Tabs.Tab value={"payments"}>Payments</Tabs.Tab>
          </Tabs.List>

          <Divider />

          <Tabs.Panel value={"profile"}>
            <EditProfilePanel />
          </Tabs.Panel>
          <Tabs.Panel value={"connect"}>
            <StripeConnectPanel />
          </Tabs.Panel>
          <Tabs.Panel value={"payments"}>
            <></>
          </Tabs.Panel>
        </Tabs>
      </Stack>
    )
  );
}
