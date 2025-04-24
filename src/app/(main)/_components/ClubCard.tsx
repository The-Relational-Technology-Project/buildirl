import {
  Box,
  Button,
  Flex,
  Paper,
  Stack,
  Text,
  Title,
  TitleOrder,
  useMatches
} from "@mantine/core";
import { useRouter } from "next/navigation";
import ClubImage from "~/client/components/ClubImage";
import MemberCountStatistic from "~/client/components/MemberCountStatistic";
import { Club } from "~/server/service/types";
import { Maybe } from "~/utils/types";

type ClubCardProps = {
  club: Club;
  isOwned: boolean;
  // null if isOwned is true
  membershipId: Maybe<bigint>;
};

export default function ClubCard({
  club,
  isOwned,
  membershipId
}: ClubCardProps) {
  // defensive check
  if (!isOwned && null === membershipId) {
    throw new Error("require membershipId for unowned club");
  }

  const isMobile = useMatches({ base: true, md: false });
  const titleOrder = useMatches<TitleOrder>({ base: 6, md: 4 });
  const buttonWidth = useMatches({ base: 130, md: 200 });
  const manageMembershipText = useMatches({
    base: "Membership",
    md: "Manage Membership"
  });

  const router = useRouter();

  return (
    <Paper p={{ base: "lg", md: "xl" }} h={{ base: 180, md: 220 }}>
      <Flex
        direction={"row"}
        h={"100%"}
        justify="flex-start"
        align={"center"}
        gap={{ base: 0, md: "md" }}
      >
        <ClubImage club={club} size={{ base: 110, md: 120 }} />

        <Stack h={"100%"} justify="space-between" ml={{ base: "lg", md: "xl" }}>
          <Stack gap={6}>
            <Title order={titleOrder} lineClamp={1}>
              {club.name}
            </Title>

            {!isMobile && (
              <>
                <Text
                  size="sm"
                  lineClamp={2}
                  style={{ wordWrap: "break-word" }}
                >
                  {club.tagLine}
                </Text>
                <MemberCountStatistic clubId={club.id} />
              </>
            )}
          </Stack>

          <Flex direction={{ base: "column", md: "row" }} gap={"xs"}>
            <Box>
              {isOwned ? (
                <Button
                  w={buttonWidth}
                  onClick={() => router.push(`/club/${club.id}/manage`)}
                >
                  Manage Club
                </Button>
              ) : (
                <Button
                  w={buttonWidth}
                  onClick={() =>
                    router.push(`/club/${club.id}/manage-membership`)
                  }
                >
                  {manageMembershipText}
                </Button>
              )}
            </Box>
            <Box>
              <Button
                w={buttonWidth}
                onClick={() => router.push(`/join/${club.publicId}`)}
              >
                Go to Club
              </Button>
            </Box>
          </Flex>
        </Stack>
      </Flex>
    </Paper>
  );
}
