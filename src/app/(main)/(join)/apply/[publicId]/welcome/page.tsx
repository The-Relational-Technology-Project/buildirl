"use client";

import { Stack, Title, Button, Avatar, Group, Center } from "@mantine/core";
import confetti from "canvas-confetti";
import { useParams, useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { QueryError } from "~/client/utils/QueryError";
import { isAllLoaded } from "~/client/utils";
import { storageClient } from "~/client/utils/storageClient";
import { useEffect } from "react";
import ClubImage from "~/client/components/ClubImage";
import ColorSchemeAwareOutlineButton from "~/client/components/ColorSchemeAwareOutlineButton";

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
      <Center>
        <Stack align="center" gap="xl" mt={"xl"}>
          <Title order={2}>You've been approved!</Title>

          <Group gap="xl">
            <Avatar
              size={120}
              radius={90}
              src={storageClient.userProfileImageUrl(c.data!.id)}
            />
            <ClubImage size={120} club={c.data!} />
          </Group>

          <Stack gap={"sm"} align={"center"}>
            <Title order={3}>Welcome {u.data!.firstName}!</Title>
            <Title order={4} mt={"sm"}>
              You Are Now a Member of
            </Title>
            <Title order={3}>{c.data!.name}</Title>
          </Stack>

          <Title order={3}>Celebrate Publicly!</Title>

          <Stack gap="md" w={"100%"}>
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

            <ColorSchemeAwareOutlineButton
              size="lg"
              radius="xl"
              onClick={() => router.push(`/join/${publicId}`)}
            >
              Enter
            </ColorSchemeAwareOutlineButton>
          </Stack>
        </Stack>
      </Center>
    )
  );
}
