"use client";

import {
  Image,
  Text,
  Group,
  Button,
  Stack,
  Title,
  Paper,
  Flex
} from "@mantine/core";
import { useRouter } from "next/navigation";
import { isAllLoaded } from "~/client/utils";
import { QueryError } from "~/client/utils/QueryError";
import { storageClient } from "~/client/utils/storageClient";
import type { Club } from "~/server/service/types";
import { api } from "~/trpc/react";
import { Maybe } from "~/utils/types";
import { MemberCountStatistic } from "~/client/components/MemberCountStatistic";

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

  const router = useRouter();

  return (
    <Paper p="lg" radius="md" withBorder>
      <Group justify="space-between" align="stretch" h={150}>
        <Flex direction="column" justify="space-between">
          <Stack gap={6}>
            <Title order={4}>{club.name}</Title>

            <MemberCountStatistic clubId={club.id} />

            <Text
              size="sm"
              c="dimmed"
              lineClamp={3}
              w={400}
              style={{ wordWrap: "break-word" }}
            >
              {club.tagLine}
            </Text>
          </Stack>

          <Group justify="flex-start">
            <Button
              variant="light"
              onClick={() => router.push(`/share/${club.publicId}`)}
            >
              View club
            </Button>
            {isOwned ? (
              <Button onClick={() => router.push(`/club/manage/${club.id}`)}>
                Manage club
              </Button>
            ) : (
              <Button
                onClick={() =>
                  router.push(`/membership/manage/${membershipId!}`)
                }
              >
                Manage membership
              </Button>
            )}
          </Group>
        </Flex>

        <Image
          src={storageClient.clubProfileImageUrl(club.id)}
          fallbackSrc="/club-profile-fallback.png"
          h={120}
          w={120}
          radius={"md"}
          alt={club.name}
        />
      </Group>
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

  if (r.data!.length === 0 && m.data!.length === 0) {
    return (
      <Stack mt={"xl"} justify="center" style={{ minHeight: "60vh" }}>
        <Title order={1} mb={"md"}>
          Clubs
        </Title>
        <Stack justify="center" align="center" gap={10} style={{ flex: 1 }}>
          <Image
            src="/home-icon.svg"
            alt="No clubs"
            w={120}
            style={{ filter: "invert(0.6)" }}
          />
          <Title order={3} c="dimmed" mt={20}>
            No clubs found
          </Title>
          <Text size={"md"} c={"dimmed"}>
            Discover clubs or create one of your own.
          </Text>
          <Button onClick={() => router.push("/club/create")}>
            Create club
          </Button>
        </Stack>
      </Stack>
    );
  }

  return (
    <Stack mt={"xl"}>
      <Title order={1} mb={"md"}>
        Clubs
      </Title>
      {r.data!.map((c) => (
        <ClubCard key={c.id} club={c} isOwned={true} membershipId={null} />
      ))}
      {m.data!.map((m) => (
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
