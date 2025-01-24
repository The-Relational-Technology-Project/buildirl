"use client";

import { api } from "~/trpc/react";
import {
  Group,
  Paper,
  Stack,
  Tabs,
  Title,
  Image,
  Button,
  Text,
  ThemeIcon
} from "@mantine/core";
import React from "react";
import { useParams } from "next/navigation";
import { QueryError } from "~/client/utils/QueryError";
import { isLoaded } from "~/client/utils";
import { Club } from "~/server/service/types";
import { IconAlertTriangle, IconCheck } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { logger, notifyError } from "~/client/logger";

type OverviewPanelProps = {
  club: Club;
};

async function copyToClipboard(clubPublicId: string): Promise<void> {
  const url = window.location.origin + "/share/" + clubPublicId;

  try {
    await navigator.clipboard.writeText(url);
    notifications.show({
      title: "Link copied",
      message: "Share link has been copied to clipboard",
      color: "green",
      icon: <IconCheck size="1.1rem" />,
      autoClose: 3000
    });
  } catch (e) {
    logger.error("error while copying to clipboard: " + e);
    notifyError();
  }
}

function OverviewPanel({ club }: OverviewPanelProps) {
  return (
    <Paper radius="md" p="xl" withBorder mt={20}>
      <Group justify={"flex-start"} align={"stretch"} gap={40}>
        <Image
          radius="md"
          w={300}
          h={300}
          fallbackSrc={"/image-fallback.png"}
        />
        <Stack justify={"space-between"} style={{ flex: 1 }}>
          <Stack gap={6}>
            <Title order={4}>Club Details</Title>
            <Title order={5} mt={2}>
              Name
            </Title>
            <Text>{club.name}</Text>
            <Title order={5}>Tagline</Title>
            {club.tagLine === "" ? (
              <Group gap={4}>
                <ThemeIcon color={"orange.5"} variant={"white"} size={"xs"}>
                  <IconAlertTriangle />
                </ThemeIcon>
                <Text c={"orange.5"}>
                  Please enter tagline and other basic information.
                </Text>
              </Group>
            ) : (
              <Text>{club.tagLine}</Text>
            )}
          </Stack>
          <Group grow>
            <Button mt={"sm"} onClick={() => {}}>
              Edit Club Page
            </Button>
            <Button
              mt={"sm"}
              onClick={async () => {
                await copyToClipboard(club.publicId);
              }}
            >
              Share
            </Button>
          </Group>
        </Stack>
      </Group>
    </Paper>
  );
}

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
