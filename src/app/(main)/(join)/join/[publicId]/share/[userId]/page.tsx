"use client";

import { useParams, useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { QueryError } from "~/client/utils/QueryError";
import { isAllLoaded } from "~/client/utils";
import { Avatar, Button, Center, Group, Stack, Title } from "@mantine/core";
import { storageClient } from "~/client/utils/storageClient";
import ClubImage from "~/client/components/ClubImage";
import { strictParseInt } from "~/utils";
import { activeMembershipForClub } from "~/utils/types";

export default function Share() {
  const params = useParams<{ publicId: string; userId: string }>();
  const publicId = params.publicId;
  const userId = strictParseInt(params.userId);
  const router = useRouter();

  const r = api.main.clubByPublicId.useQuery({ publicId });
  const u = api.main.userById.useQuery({ id: userId });
  const m = api.main.userMemberships.useQuery();

  QueryError.check({
    result: r,
    fieldName: "clubByPublicId"
  });

  QueryError.check({
    result: u,
    fieldName: "userById"
  });

  QueryError.check({
    result: m,
    fieldName: "userMemberships"
  });

  if (!isAllLoaded([r, u, m])) {
    return null;
  }

  // only active members can share this page
  const membership = activeMembershipForClub(m.data!, r.data!.id);
  if (null === membership) {
    throw new Error(
      `user ${u.data!.id} is not an active member of club ${r.data!.id}`
    );
  }

  return (
    <Center>
      <Stack align="center" gap="xl" mt={"xl"}>
        <Title order={2}>I'm a Proud Member!</Title>

        <Group gap="xl">
          <Avatar
            size={120}
            radius={90}
            src={storageClient.userProfileImageUrl(r.data!.id)}
          />
          <ClubImage size={120} club={r.data!} />
        </Group>

        <Stack gap={"sm"} align={"center"}>
          <Title order={4} mt={"sm"}>
            I am a Member of
          </Title>
          <Title order={3}>{r.data!.name}</Title>
        </Stack>

        <Button
          size="lg"
          radius="xl"
          color="violet"
          onClick={() => router.push(`/join/${publicId}`)}
        >
          Join Me
        </Button>
      </Stack>
    </Center>
  );
}
