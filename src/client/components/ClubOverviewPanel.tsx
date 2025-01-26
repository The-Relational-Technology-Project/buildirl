import { Club } from "~/server/service/types";
import {
  Button,
  Group,
  Image,
  Paper,
  Stack,
  Text,
  ThemeIcon,
  Title
} from "@mantine/core";
import React from "react";
import { notifications } from "@mantine/notifications";
import { IconAlertTriangle, IconCheck } from "@tabler/icons-react";
import { logger, notifyError } from "~/client/logger";
import createStorageClient from "~/client/utils/storageClient";
import { useRouter } from "next/navigation";
import { MemberCountStatistic } from "~/client/components/MemberCountStatistic";

type ClubOverviewPanelProps = {
  club: Club;
};

export function ClubOverviewPanel({ club }: ClubOverviewPanelProps) {
  const storage = createStorageClient();
  const router = useRouter();

  return (
    <>
      <Paper radius="md" p="xl" withBorder mt={20}>
        <Group justify={"flex-start"} align={"stretch"} gap={40}>
          <Image
            radius="md"
            w={300}
            h={300}
            src={storage.clubProfileImageUrl(club.id)}
            fallbackSrc={"/club-profile-fallback.png"}
          />
          <Stack justify={"space-between"} style={{ flex: 1 }}>
            <Stack gap={6}>
              <Title order={4}>Club Details</Title>
              <Title order={5} mt={6}>
                Name
              </Title>
              <Text c={"dimmed"}>{club.name}</Text>

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
                <Text c={"dimmed"}>{club.tagLine}</Text>
              )}

              <MemberCountStatistic clubId={club.id} mt={"sm"} />
            </Stack>
            <Group grow>
              <Button
                mt={"sm"}
                onClick={() => router.push(`${club.id}/update`)}
              >
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
    </>
  );
}

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
