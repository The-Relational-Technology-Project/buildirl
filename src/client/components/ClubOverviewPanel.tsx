import { Club } from "~/server/service/types";
import {
  Button,
  Flex,
  Group,
  Image,
  Paper,
  Stack,
  Text,
  Title,
  useMatches
} from "@mantine/core";
import React from "react";
import { notifications } from "@mantine/notifications";
import { IconCheck } from "@tabler/icons-react";
import { logger, notifyError } from "~/client/logger";
import createStorageClient from "~/client/utils/storageClient";
import { useRouter } from "next/navigation";
import { MemberCountStatistic } from "~/client/components/MemberCountStatistic";
import { AlertMessage } from "~/client/components/AlertMessage";

type ClubOverviewPanelProps = {
  club: Club;
};

export function ClubOverviewPanel({ club }: ClubOverviewPanelProps) {
  const storage = createStorageClient();
  const router = useRouter();
  const editButtonText = useMatches({ base: "Edit", sm: "Edit Club Page" });

  return (
    <Stack>
      <Paper p="xl" withBorder mt={"lg"}>
        <Flex
          direction={{ base: "column", md: "row" }}
          justify={"flex-start"}
          align={{ base: "center", md: "stretch" }}
          gap={40}
        >
          <Image
            radius="md"
            w={{ base: 240, md: 300 }}
            h={{ base: 240, md: 300 }}
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
                <AlertMessage
                  message={"Please enter tagline and other basic information."}
                />
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
                {editButtonText}
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
        </Flex>
      </Paper>
    </Stack>
  );
}

async function copyToClipboard(clubPublicId: string): Promise<void> {
  const url = `${window.location.origin}/join/${clubPublicId}`;

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
