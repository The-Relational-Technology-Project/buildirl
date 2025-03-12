"use client";

import {
  Text,
  Button,
  Stack,
  Title,
  Paper,
  Flex,
  useMatches,
  Space,
  Box,
  TitleOrder
} from "@mantine/core";
import { useRouter } from "next/navigation";
import { isAllLoaded } from "~/client/utils";
import { QueryError } from "~/client/utils/QueryError";
import type { Club } from "~/server/service/types";
import { api } from "~/trpc/react";
import { Maybe } from "~/utils/types";
import MemberCountStatistic from "~/client/components/MemberCountStatistic";
import ClubImage, { DefaultClubImage } from "~/client/components/ClubImage";
import ColorSchemeAwareThemeIcon from "~/client/components/ColorSchemeAwareThemeIcon";
import { IconChevronRight } from "@tabler/icons-react";

type ClubCardProps = {
  club: Club;
  isOwned: boolean;
  // null if isOwned is true
  membershipId: Maybe<bigint>;
};

function ClubCard({ club, isOwned, membershipId }: ClubCardProps) {
  // defensive check
  if (!isOwned && null === membershipId) {
    throw new Error("require membershipId for unowned club");
  }

  const isMobile = useMatches({ base: true, md: false });
  const editMembershipText = useMatches({
    base: "Membership",
    md: "Manage Membership"
  });
  const chevronSize = useMatches({ base: 16, md: 32 });
  const titleOrder = useMatches<TitleOrder>({ base: 6, md: 4 });
  const buttonSize = useMatches({ base: "xs", md: "md" });

  const router = useRouter();

  return (
    <Paper
      p={{ base: "md", md: "xl" }}
      h={{ base: 120, md: 220 }}
      onClick={(e) => {
        // don't navigate if clicking on child buttons
        if ((e.target as HTMLElement).closest("button")) {
          e.stopPropagation();
          return;
        }
        router.push(`/join/${club.publicId}`);
      }}
    >
      <Flex
        direction={"row"}
        h={"100%"}
        justify="flex-start"
        align={"center"}
        gap={{ base: 0, md: "md" }}
      >
        <ClubImage club={club} size={{ base: 80, md: 120 }} />

        <Stack h={"100%"} justify="space-between" ml={{ base: "md", md: "xl" }}>
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

          <Box>
            {isOwned ? (
              <Button
                size={buttonSize}
                onClick={() => router.push(`/club/${club.id}/manage`)}
              >
                Manage Club
              </Button>
            ) : (
              <Button
                size={buttonSize}
                onClick={() =>
                  router.push(`/club/${club.id}/manage-membership`)
                }
              >
                {editMembershipText}
              </Button>
            )}
          </Box>
        </Stack>

        <Space style={{ flex: 1 }} />

        <ColorSchemeAwareThemeIcon>
          <IconChevronRight size={chevronSize} />
        </ColorSchemeAwareThemeIcon>
      </Flex>
    </Paper>
  );
}

export default function Home() {
  const titleOrder = useMatches<TitleOrder>({ base: 2, md: 1 });

  const r = api.main.userOwnedClubs.useQuery();
  const m = api.main.userMemberships.useQuery();
  const router = useRouter();

  QueryError.check({
    result: r,
    fieldName: "userOwnedClubs"
  });

  QueryError.check({
    result: m,
    fieldName: "userMemberships"
  });

  if (!isAllLoaded([r, m])) {
    return null;
  }

  const activeMemberships = m.data!.filter((m) => m.status === "ACTIVE");

  if (r.data!.length === 0 && activeMemberships.length === 0) {
    return (
      <Stack mt={"xl"} justify="center" style={{ minHeight: "60vh" }}>
        <Title order={titleOrder} mb={"md"}>
          Clubs
        </Title>
        <Stack justify="center" align="center" gap={"xs"} style={{ flex: 1 }}>
          <DefaultClubImage size={150} />
          <Title order={3} mt={"lg"}>
            You are not part of any clubs!
          </Title>
          <Text size={"md"}>Discover clubs or create one of your own</Text>
          <Button
            onClick={() => router.push("/club/create")}
            mt={"md"}
            size={"lg"}
          >
            Create club
          </Button>
        </Stack>
      </Stack>
    );
  }

  return (
    <Stack my={"xl"}>
      <Title order={titleOrder} mb={"sm"}>
        Clubs
      </Title>
      {r
        .data!.sort((c1, c2) => c1.id - c2.id)
        .map((c) => (
          <ClubCard key={c.id} club={c} isOwned={true} membershipId={null} />
        ))}
      {activeMemberships
        .sort((m1, m2) => m1.club.id - m2.club.id)
        .map((m) => (
          <ClubCard
            key={m.club.id}
            club={m.club}
            isOwned={false}
            membershipId={m.id}
          />
        ))}
      <Text
        size={"sm"}
        style={{ alignSelf: "center", textAlign: "center" }}
        mt={10}
      >
        Join a club or{" "}
        <a href="/club/create" style={{ color: "inherit" }}>
          create
        </a>{" "}
        one of your own.
      </Text>
    </Stack>
  );
}
