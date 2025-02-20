"use client";

import { useParams, useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { QueryError } from "~/client/utils/QueryError";
import { isAllLoaded } from "~/client/utils";
import { Avatar, Button, Center, Group, Stack, Title } from "@mantine/core";
import { storageClient } from "~/client/utils/storageClient";
import ClubImage from "~/client/components/ClubImage";
import { strictParseInt } from "~/utils";

export default function Share() {
  const params = useParams<{ publicId: string; userId: string }>();
  const publicId = params.publicId;
  const userId = strictParseInt(params.userId);
  const router = useRouter();

  const r = api.main.clubByPublicId.useQuery({ publicId });
  const u = api.main.userById.useQuery({ id: userId });

  QueryError.check({
    result: r,
    fieldName: "clubByPublicId"
  });

  QueryError.check({
    result: u,
    fieldName: "userById"
  });

  if (!isAllLoaded([r, u])) {
    return null;
  }

  // TODO restrict share page only to active members. This requires creating a public procedure to
  //  get club active membership status. We do not want to open up userMemberships endpoint broadly as
  //  it contains sensitive data

  return (
    <Center>
      <Stack align="center" gap="xl" mt={"xl"}>
        <Title order={2}>I'm a Proud Member!</Title>

        <Group gap="xl">
          <Avatar
            size={120}
            radius={90}
            src={storageClient.userProfileImageUrl(u.data!.id)}
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
