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
import { activeMembershipForClub } from "~/utils/types";

export default function Welcome() {
  const params = useParams<{ publicId: string }>();
  const publicId = params.publicId;
  const router = useRouter();

  const r = api.main.clubByPublicId.useQuery({ publicId });
  const u = api.main.user.useQuery();
  const m = api.main.userMemberships.useQuery();

  const utils = api.useUtils();
  const setMembershipAsWelcomed = api.main.setMembershipAsWelcomed.useMutation({
    onSuccess: () => {
      utils.main.userMemberships.invalidate();
    }
  });

  QueryError.check({
    result: r,
    fieldName: "clubByPublicId"
  });

  QueryError.check({
    result: u,
    fieldName: "user"
  });

  QueryError.check({
    result: m,
    fieldName: "userMemberships"
  });

  if (!isAllLoaded([r, u, m])) {
    return null;
  }

  // only active members can view this page
  const membership = activeMembershipForClub(m.data!, r.data!.id);
  if (null === membership) {
    throw new Error(`user is not an active member of club ${r.data!.id}`);
  }

  // we mark membership `isWelcomed` here so that the user is only redirected
  // to the welcome page once; they may still visit the page again with the direct link
  useEffect(() => {
    if (!membership.isWelcomed) {
      void setMembershipAsWelcomed.mutate({
        membershipId: membership.id
      });
    }
  }, [membership]);

  useEffect(() => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  }, []);

  const onShare = () => {
    const shareUrl = `${window.location.origin}/join/${publicId}/share/${u.data!.id}`;
    if (navigator.share) {
      void navigator.share({
        title: `Join me at ${r.data!.name}!`,
        url: shareUrl
      });
    } else {
      window.open(shareUrl, "_blank");
    }
  };

  return (
    <Center>
      <Stack align="center" gap="xl" mt={"xl"}>
        <Title order={2}>You've been approved!</Title>

        <Group gap="xl">
          <Avatar
            size={120}
            radius={90}
            src={storageClient.userProfileImageUrl(r.data!.id)}
          />
          <ClubImage size={120} club={r.data!} />
        </Group>

        <Stack gap={"sm"} align={"center"}>
          <Title order={3}>Welcome {u.data!.firstName}!</Title>
          <Title order={4} mt={"sm"}>
            You Are Now a Member of
          </Title>
          <Title order={3}>{r.data!.name}</Title>
        </Stack>

        <Title order={3}>Celebrate Publicly!</Title>

        <Stack gap="md" w={"100%"}>
          <Button size="lg" radius="xl" color="violet" onClick={onShare}>
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
  );
}
