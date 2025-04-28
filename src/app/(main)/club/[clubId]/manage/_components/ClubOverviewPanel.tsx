import { Club } from "~/server/service/types";
import {
  Box,
  Button,
  Flex,
  Group,
  Paper,
  Stack,
  Text,
  Title,
  useMatches
} from "@mantine/core";
import React from "react";
import { useRouter } from "next/navigation";
import MemberCountStatistic from "~/client/components/MemberCountStatistic";
import AlertMessage from "~/client/components/AlertMessage";
import ClubImage from "~/client/components/ClubImage";

type ClubOverviewPanelProps = {
  club: Club;
};

export default function ClubOverviewPanel({ club }: ClubOverviewPanelProps) {
  const router = useRouter();
  const editButtonText = useMatches({
    base: "Edit Page",
    md: "Edit Club Page"
  });
  const visitButtonText = useMatches({
    base: "Go to Page",
    md: "Go to Club Page"
  });
  const clubImageSize = useMatches({ base: 240, md: 300 });

  return (
    <Stack>
      <Paper p="xl" mt={"lg"} mb={20}>
        <Flex
          direction={{ base: "column", md: "row" }}
          justify={"flex-start"}
          align={{ base: "center", md: "stretch" }}
          gap={40}
        >
          <Box style={{ alignSelf: "center" }}>
            <ClubImage club={club} size={clubImageSize} />
          </Box>
          <Stack justify={"space-between"} style={{ flex: 1 }}>
            <Stack gap={6}>
              <Title order={4}>Club Details</Title>
              <Title order={5} mt={6}>
                Name
              </Title>
              <Text>{club.name}</Text>

              <Title order={5}>Tagline</Title>
              {club.tagLine === "" ? (
                <AlertMessage
                  message={"Please enter tagline and other basic information."}
                />
              ) : (
                <Text>{club.tagLine}</Text>
              )}

              <MemberCountStatistic clubId={club.id} mt={"sm"} />
            </Stack>
            <Group grow>
              <Button
                mt={"sm"}
                onClick={() => router.push(`/club/${club.id}/manage/update`)}
              >
                {editButtonText}
              </Button>
              <Button
                mt={"sm"}
                onClick={() => router.push(`/join/${club.publicId}/`)}
              >
                {visitButtonText}
              </Button>
            </Group>
          </Stack>
        </Flex>
      </Paper>
    </Stack>
  );
}
