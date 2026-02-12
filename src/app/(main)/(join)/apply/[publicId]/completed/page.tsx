"use client";

import {
  Stack,
  Title,
  Text,
  Center,
  Paper,
  Button,
  Box,
  useMantineColorScheme,
  useMantineTheme
} from "@mantine/core";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import ClubImage from "~/client/components/ClubImage";
import { api } from "~/trpc/react";
import { QueryError } from "~/client/utils/QueryError";
import { isLoaded } from "~/client/utils";
import { ReturnToCampaignSection } from "~/app/(main)/(join)/apply/[publicId]/completed/__components/ReturnToCampaignSection";
import { CAMPAIGN_CONFIGURATIONS } from "~/app/(main)/(join)/campaign/[publicId]/config";

export default function ApplicationCompleted() {
  const params = useParams<{ publicId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isTierChange = searchParams.get("flow") === "tier-change";
  const { colorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();
  const isDark = colorScheme === "dark";
  const borderColor = isDark ? theme.other.dark.borderStrong : "#0d0d0d";
  const shadowColor = isDark ? theme.other.dark.shadow : "#0d0d0d";
  const surfaceColor = isDark ? theme.other.dark.surface : "#fffaf0";
  const textColor = isDark ? theme.other.dark.text : undefined;
  const mutedTextColor = isDark ? theme.other.dark.textMuted : "dimmed";
  const buttonBg = isDark ? theme.colors.lilac?.[5] ?? "#6f3bd2" : "#6f3bd2";
  const buttonBorder = isDark ? theme.other.dark.ink : "#0d0d0d";

  const club = api.main.clubByPublicId.useQuery({
    publicId: params.publicId
  });
  QueryError.check({
    result: club,
    fieldName: "clubByPublicId"
  });

  // !! PROTOTYPE
  if (
    CAMPAIGN_CONFIGURATIONS.find((c) => c.clubPublicId === params.publicId) !==
    undefined
  ) {
    return <ReturnToCampaignSection club={club.data!} />;
  }
  const pageContent = {
    title: isTierChange ? "TIER CHANGE SUCCESSFUL!" : "THANK YOU FOR APPLYING!",
    message: isTierChange
      ? "Your membership tier has been updated."
      : "Application has been sent for review. You'll receive an email with an update soon.",
    buttonText: isTierChange ? "View Membership" : "Return Home",
    buttonUrl: isTierChange 
      ? `/club/${club.data?.id}/manage-membership` 
      : `/join/${params.publicId}/`,
    showApplicationNote: !isTierChange
  };

  return (
    isLoaded(club) && (
      <Center mih="100vh" px={{ base: 16, sm: 24 }} py={{ base: 48, md: 80 }}>
        <Paper
          radius={24}
          p={{ base: "xl", md: 48 }}
          w="100%"
          maw={720}
          style={{
            backgroundColor: surfaceColor,
            border: `2px solid ${borderColor}`,
            boxShadow: `8px 10px 0 ${shadowColor}`,
            color: textColor
          }}
        >
          <Stack align="center" gap="md">
            <Title order={1} ta="center">
              {pageContent.title}
            </Title>
            <Text ta="center" size="sm" maw={520} c={mutedTextColor}>
              {pageContent.message}
            </Text>

            <ClubImage club={club.data!} size={220} />

            {!isTierChange && (
              <Text ta="center" size="sm" maw={520} c={mutedTextColor}>
                In the meantime, use this time to make sure your profile is up
                to date. This helps club leaders verify you’re a legit person.
              </Text>
            )}

            <Box pt="xs">
              <Button
                size="md"
                radius={8}
                w={260}
                styles={{
                  root: {
                    backgroundColor: buttonBg,
                    border: `2px solid ${buttonBorder}`,
                    color: "white",
                    boxShadow: `4px 4px 0 ${shadowColor}`
                  }
                }}
                onClick={() => {
                  router.push(
                    isTierChange
                      ? pageContent.buttonUrl
                      : "/settings?tab=profile"
                  );
                }}
              >
                {isTierChange ? pageContent.buttonText : "Go to profile"}
              </Button>
            </Box>

            {!isTierChange && (
              <Button
                variant="subtle"
                size="xs"
                color={isDark ? theme.other.dark.textMuted : "dark"}
                onClick={() => {
                  router.push(`/join/${params.publicId}/`);
                }}
              >
                Return Home →
              </Button>
            )}

            {pageContent.showApplicationNote && (
              <Text ta="center" size="xs" c={mutedTextColor} maw={520} mt="md">
                If you wish to withdraw your application, you can manage your
                application from the club page.
              </Text>
            )}
          </Stack>
        </Paper>
      </Center>
    )
  );
}
