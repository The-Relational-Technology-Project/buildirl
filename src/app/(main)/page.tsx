"use client";

import {
  Text,
  Button,
  Stack,
  Title,
  Paper,
  Flex,
  useMatches
} from "@mantine/core";
import { useRouter } from "next/navigation";
import { isAllLoaded } from "~/client/utils";
import { QueryError } from "~/client/utils/QueryError";
import type { Club } from "~/server/service/types";
import { api } from "~/trpc/react";
import { Maybe } from "~/utils/types";
import MemberCountStatistic from "~/client/components/MemberCountStatistic";
import ClubImage, { DefaultClubImage } from "~/client/components/ClubImage";

type ClubCardProps = {
  club: Club;
  isOwned: boolean;
  // null if isOwned is true
  membershipId: Maybe<bigint>;
};

function ClubCard({ club, isOwned, membershipId }: ClubCardProps) {
  const manageMembershipText = useMatches({
    base: "Membership",
    md: "Manage Membership"
  });

  // defensive check
  if (!isOwned && null === membershipId) {
    throw new Error("require membershipId for unowned club");
  }

  const router = useRouter();

  return (
    <Paper p="lg" withBorder>
      <Flex
        direction={{ base: "column-reverse", xs: "row" }}
        justify="space-between"
        align={{ base: "center", xs: "stretch" }}
        gap={"md"}
      >
        <Stack justify="space-between">
          <Stack gap={6}>
            <Title order={4}>{club.name}</Title>

            <MemberCountStatistic clubId={club.id} />

            <Text
              size="sm"
              c="dimmed"
              lineClamp={3}
              maw={400}
              style={{ wordWrap: "break-word" }}
            >
              {club.tagLine}
            </Text>
          </Stack>

          <Flex gap={"md"} justify={{ base: "center", xs: "flex-start" }}>
            <Button
              variant="light"
              onClick={() => router.push(`/join/${club.publicId}`)}
            >
              View club
            </Button>
            {isOwned ? (
              <Button onClick={() => router.push(`/club/${club.id}/manage`)}>
                Edit Club
              </Button>
            ) : (
              <Button
                onClick={() =>
                  router.push(`/club/${club.id}/manage-membership`)
                }
              >
                {manageMembershipText}
              </Button>
            )}
          </Flex>
        </Stack>

        <ClubImage club={club} size={120} />
      </Flex>
    </Paper>
  );
}

export default function Home() {
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
        <Title order={1} mb={"md"}>
          Clubs
        </Title>
        <Stack justify="center" align="center" gap={"xs"} style={{ flex: 1 }}>
          <DefaultClubImage size={150} />
          <Title order={3} mt={"lg"}>
            You are not part of any clubs!
          </Title>
          <Text size={"md"} c={"dimmed"}>
            Discover clubs or create one of your own
          </Text>
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
      <Title order={1} mb={"sm"}>
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
      <Text size={"sm"} c={"dimmed"} style={{ alignSelf: "center" }} mt={10}>
        Discover more clubs to join or{" "}
        <a href="/club/create" style={{ color: "inherit" }}>
          create
        </a>{" "}
        one of your own.
      </Text>
    </Stack>
  );
}
