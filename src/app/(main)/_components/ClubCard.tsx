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
import { Club } from "~/server/service/types";

type ClubStatus = "OWNED" | "JOINED" | "APPLIED" | "FOLLOWING";

type ManageButtonProps = {
  clubId: number;
  status: ClubStatus;
  width: number;
};

function ManageButton({ clubId, status, width }: ManageButtonProps) {
  const manageMembershipText = useMatches({
    base: "Membership",
    md: "Manage Membership"
  });
  const router = useRouter();

  if (status === "OWNED") {
    return (
      <Box>
        <Button w={width} onClick={() => router.push(`/club/${clubId}/manage`)}>
          Manage Club
        </Button>
      </Box>
    );
  }
  if (status === "JOINED") {
    return (
      <Box>
        <Button
          w={width}
          onClick={() => router.push(`/club/${clubId}/manage-membership`)}
        >
          {manageMembershipText}
        </Button>
      </Box>
    );
  }

  // no action button for applied, following, etc
  return null;
}

type ClubCardProps = {
  club: Club;
  status: ClubStatus;
};

export default function ClubCard({ club, status }: ClubCardProps) {
  const isMobile = useMatches({ base: true, md: false });
  const titleOrder = useMatches<TitleOrder>({ base: 6, md: 4 });
  const buttonWidth = useMatches({ base: 130, md: 200 });

  const router = useRouter();

  return (
    <Paper p={{ base: "lg", md: "xl" }} h={{ base: 160, md: 220 }}>
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
              </>
            )}
          </Stack>

          <Flex direction={{ base: "column", md: "row" }} gap={"xs"}>
            <ManageButton
              clubId={club.id}
              status={status}
              width={buttonWidth}
            />
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
