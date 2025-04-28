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
  useMatches,
  Anchor,
  Box
} from "@mantine/core";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import MemberCountStatistic from "~/client/components/MemberCountStatistic";
import AlertMessage from "~/client/components/AlertMessage";
import ClubImage from "~/client/components/ClubImage";
import ShareButton from "./ShareButton";

type ClubOverviewPanelProps = {
  club: Club;
};

export default function ClubOverviewPanel({ club }: ClubOverviewPanelProps) {
  const router = useRouter();
  const [memberCount, setMemberCount] = useState<number | null>(null);
  
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
          style={{ position: "relative" }}
        >
          <Box style={{ alignSelf: "center" }}>
            <ClubImage club={club} size={clubImageSize} />
          </Box>
          <Stack justify={"space-between"} style={{ flex: 1 }}>
            <Box style={{ position: "absolute", top: 0, right: 0, zIndex: 1 }}>
              <ShareButton 
                clubPublicId={club.publicId}
                clubName={club.name}
                size="sm"
              />
            </Box>
            
            <Stack gap={6}>
              <Title order={4}>Club Details</Title>
              <Title order={5} mt={6}>
                Name
              </Title>
              <Text>{club.name}</Text>

              <Title order={5}>Tagline</Title>
              {club.tagLine === "" ? (
                <AlertMessage
                  message={"Please add tagline and basic information."}
                />
              ) : (
                <Text>{club.tagLine}</Text>
              )}

              <MemberCountStatistic 
                clubId={club.id} 
                mt={"sm"} 
                onMemberCountChange={setMemberCount}
              />
              
              {memberCount === 1 && (
                <AlertMessage
                  message={"Customize your membership tiers and intake tabs, then share your club link to invite your first members."}
                  mt={4}
                />
              )}
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
      
      <Paper p="lg" mb={20}>
        <Stack gap="xs">
          <Title order={5}>Getting Started?</Title>
          <Text>
            Check out our <Anchor href="https://tulip-iron-c45.notion.site/Build-IRL-Help-Center-1e2a8ae4b4d280a9a8ede144bf158764" target="_blank">quick set up guide</Anchor>.
          </Text>
        </Stack>
      </Paper>
    </Stack>
  );
}
