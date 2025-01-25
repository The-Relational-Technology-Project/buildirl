"use client";

import {
  Image,
  Text,
  Group,
  Button,
  Stack,
  Title,
  Paper,
  Flex,
  ThemeIcon,
  GroupProps
} from "@mantine/core";
import { useRouter } from "next/navigation";
import { isAllLoaded, isLoaded } from "~/client/utils";
import { QueryError } from "~/client/utils/QueryError";
import { storageClient } from "~/client/utils/storageClient";
import type { Club } from "~/server/service/types";
import { api } from "~/trpc/react";
import { Maybe } from "~/utils/types";
import { IconUsers } from "@tabler/icons-react";

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

type MemberCountStatisticProps = {
  clubId: number;
};

export function MemberCountStatistic({
  clubId,
  ...props
}: MemberCountStatisticProps & GroupProps) {
  const r = api.main.clubStatistics.useQuery({ clubId: clubId });

  QueryError.check({
    result: r,
    fieldName: "clubStatistics"
  });

  return (
    isLoaded(r) && (
      <Group gap={4} {...props}>
        <ThemeIcon
          size={"xs"}
          variant={"white"}
          c={"black"}
          style={{
            backgroundColor: "transparent"
          }}
        >
          <IconUsers />
        </ThemeIcon>
        <Text size={"sm"} fw={400}>
          {`${r.data!.memberCount} member${r.data!.memberCount > 1 ? "s" : ""}`}
        </Text>
      </Group>
    )
  );
}

export default function Home() {
  const r = api.main.userOwnedClubs.useQuery();
  const m = api.main.userMemberships.useQuery();

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
    </Stack>
  );
}
