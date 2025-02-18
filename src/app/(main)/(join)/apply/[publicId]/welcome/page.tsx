"use client";

import {
  Stack,
  Title,
  Button,
  Image,
  Avatar,
  Center,
  Group
} from "@mantine/core";
import confetti from "canvas-confetti";
import { useParams, useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { QueryError } from "~/client/utils/QueryError";
import { isAllLoaded, isLoaded } from "~/client/utils";
import { storageClient } from "~/client/utils/storageClient";
import { useEffect } from "react";

export default function Welcome() {
  const params = useParams<{ publicId: string }>();
  const publicId = params.publicId;
  const router = useRouter();

  const c = api.main.clubByPublicId.useQuery({ publicId });
  const u = api.main.user.useQuery();

  QueryError.check({
    result: c,
    fieldName: "clubByPublicId"
  });

  QueryError.check({
    result: u,
    fieldName: "currentUser"
  });

  useEffect(() => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  }, []);

  return (
    isAllLoaded([c, u]) && (
      <Center h="100vh">
        <Stack align="center" gap="xl" w={400}>
          <Title order={1} fw={700}>
            YOU'VE BEEN APPROVED!
          </Title>

          <Group gap="xl" align="center">
            <Avatar
              size={120}
              radius={60}
              src={storageClient.userProfileImageUrl(c.data!.id)}
            />
            <Image
              src={storageClient.clubProfileImageUrl(u.data!.id)}
              width={120}
              height={120}
              radius="md"
              alt={c.data!.name}
            />
          </Group>

          <Stack gap={5}>
            <Title order={3}>Welcome {u.data!.firstName}!</Title>
            <Title order={4}>You Are Now A Member Of</Title>
            <Title order={3}>{c.data!.name}!</Title>
          </Stack>

          <Title order={3}>Celebrate Publicly!</Title>

          <Stack gap="md" w="100%">
            <Button
              size="lg"
              radius="xl"
              color="violet"
              onClick={() =>
                router.push(`/join/${publicId}/share/${u.data!.id}`)
              }
            >
              Share
            </Button>

            <Button
              variant="outline"
              size="lg"
              radius="xl"
              onClick={() => router.push(`/join/${publicId}`)}
            >
              Enter
            </Button>
          </Stack>
        </Stack>
      </Center>
    )
  );
}
