"use client";

import {
  Stack,
  Title,
  useMatches,
  TitleOrder,
  Tabs,
  useMantineColorScheme,
  useMantineTheme,
  Box,
  Divider
} from "@mantine/core";
import MyClubsPanel from "~/app/(main)/_components/MyClubsPanel";
import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import InterestedClubsPanel from "~/app/(main)/_components/InterestedClubsPanel";
import { useMounted } from "@mantine/hooks";

export default function Home() {
  const { colorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();
  const mounted = useMounted();
  const titleOrder = useMatches<TitleOrder>({ base: 2, md: 1 });

  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") ?? "clubs";

  return (
    mounted && (
      <Stack my={"xl"}>
        <Title order={titleOrder}>Clubs</Title>
        <Tabs
          // hacky but how we support dark mode with defaults
          color={colorScheme === "dark" ? theme.other.dark.textMuted : undefined}
          defaultValue={activeTab}
          onChange={(value) => {
            // change url without scrolling page to top
            router.push(`?tab=${value}`, { scroll: false });
          }}
        >
          <Tabs.List>
            <Tabs.Tab value={"clubs"}>My Clubs</Tabs.Tab>
            {/* TODO! change the tab name after the showcase bazaar on 4/30 */}
            <Tabs.Tab value={"interested"}>Following</Tabs.Tab>
          </Tabs.List>

          <Divider />

          <Box mt={"md"}>
            <Tabs.Panel value={"clubs"}>
              <MyClubsPanel />
            </Tabs.Panel>
            <Tabs.Panel value={"interested"}>
              <InterestedClubsPanel />
            </Tabs.Panel>
          </Box>
        </Tabs>
      </Stack>
    )
  );
}
