import { api } from "~/trpc/react";
import { QueryError } from "~/client/utils/QueryError";
import { isLoaded } from "~/client/utils";
import {
  Anchor,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
  useMantineColorScheme,
  useMantineTheme,
  useMatches
} from "@mantine/core";
import { IconStarFilled } from "@tabler/icons-react";
import { UserImage } from "~/client/components/UserAvatar";
import { useRouter } from "next/navigation";
import { Club, ClubStatistics } from "~/server/club/types";

type ClubMembersProps = {
  club: Club;
  clubStatistics: ClubStatistics;
};

export default function ClubMembers({
  club,
  clubStatistics
}: ClubMembersProps) {
  const router = useRouter();
  const columns = useMatches({ base: 4, sm: 4 });
  const maxRows = useMatches({ base: 1, sm: 2 });
  const { colorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();
  const isDark = colorScheme === "dark";

  const clubId = club.id;

  const activeMembershipsForClub = api.main.activeMembershipsForClub.useQuery({
    clubId: clubId
  });

  QueryError.check({
    result: activeMembershipsForClub,
    fieldName: "activeMembershipsForClub"
  });

  if (!isLoaded(activeMembershipsForClub)) {
    return null;
  }

  const maxTiles = columns * maxRows;
  const memberships = activeMembershipsForClub.data!;
  const totalMembers = clubStatistics.memberCount;
  const sortedMemberships = [...memberships].sort((first, second) => {
    const firstRank = first.role === "LEAD" ? 0 : 1;
    const secondRank = second.role === "LEAD" ? 0 : 1;

    return firstRank - secondRank;
  });
  const showOverflowTile = totalMembers > maxTiles;
  const visibleMemberCount = showOverflowTile ? maxTiles - 1 : maxTiles;
  const visibleMemberships = sortedMemberships.slice(0, visibleMemberCount);
  const remainingCount = Math.max(0, totalMembers - visibleMemberships.length);
  const memberCountLabel = `${totalMembers} contributing member${
    totalMembers === 1 ? "" : "s"
  }`;

  return (
    <Stack
      w="100%"
      mb={{ base: 0, md: 32 }}
      gap={24}
      mt={{ base: "lg", sm: "lg" }}
    >
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <Stack gap={0}>
          <Title
            order={2}
            tt="uppercase"
            c={isDark ? theme.other.dark.text : undefined}
            style={{ fontFamily: club.themeHeadingFont ?? "inherit" }}
          >
            Meet the club
          </Title>
          <Text size="sm">{memberCountLabel}</Text>
        </Stack>
        <Anchor
          href={`/join/${club.publicId}/members`}
          size="sm"
          fw={600}
          td="underline"
          style={{ whiteSpace: "nowrap", alignSelf: "flex-end" }}
        >
          view all &gt;
        </Anchor>
      </Group>

      <SimpleGrid
        cols={columns}
        spacing={{ base: "xs", sm: "xs" }}
        mt={{ base: -12 }}
      >
        {visibleMemberships.map((membership) => (
          <Stack key={membership.id} gap={2}>
            <Paper
              withBorder
              radius="sm"
              pos="relative"
              style={{ cursor: "pointer", overflow: "hidden" }}
              onClick={() => router.push(`/user/${membership.id}?back=true`)}
            >
              {membership.role === "LEAD" && (
                <ThemeIcon
                  variant="filled"
                  color="yellow.5"
                  pos="absolute"
                  top={6}
                  right={6}
                  radius="sm"
                  size={26}
                  style={{ zIndex: 1 }}
                >
                  <IconStarFilled size={16} />
                </ThemeIcon>
              )}
              <UserImage
                w="100%"
                radius="sm"
                style={{ aspectRatio: "1 / 1" }}
                user={membership.user}
              />
            </Paper>
            <Text size="sm" fw={500}>
              {membership.user.firstName}
            </Text>
          </Stack>
        ))}

        {showOverflowTile && remainingCount > 0 && (
          <Stack gap={8}>
            <Paper
              withBorder
              radius="sm"
              onClick={() => router.push(`/join/${club.publicId}/members`)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                aspectRatio: "1 / 1",
                width: "100%",
                border: "2px solid #000",
                cursor: "pointer"
              }}
            >
              <Stack align="center" gap={0}>
                <Text size="lg" fw={500}>
                  + {remainingCount}
                </Text>
                <Text size="sm" fw={500} mt={"-6"}>
                  more
                </Text>
              </Stack>
            </Paper>
          </Stack>
        )}
      </SimpleGrid>
    </Stack>
  );
}
