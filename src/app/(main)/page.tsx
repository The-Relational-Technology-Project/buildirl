"use client";

import { Stack, Title, useMatches, TitleOrder } from "@mantine/core";
import JoinedClubsPanel from "~/app/(main)/_components/JoinedClubsPanel";

export default function Home() {
  const titleOrder = useMatches<TitleOrder>({ base: 2, md: 1 });

  return (
    <Stack my={"xl"}>
      <Title order={titleOrder} mb={"sm"}>
        Clubs
      </Title>
      <JoinedClubsPanel />
    </Stack>
  );
}
