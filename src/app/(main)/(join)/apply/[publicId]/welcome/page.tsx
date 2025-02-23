"use client";

import { Stack, Title, Button, Group, Center } from "@mantine/core";
import confetti from "canvas-confetti";
import { useParams, useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { QueryError } from "~/client/utils/QueryError";
import { isAllLoaded, isLoaded } from "~/client/utils";
import { useEffect } from "react";
import ClubImage from "~/client/components/ClubImage";
import SecondaryButton from "~/client/components/SecondaryButton";
import { activeMembershipForClub } from "~/utils/types";
import UserAvatar from "~/client/components/UserAvatar";

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

  // we mark membership `isWelcomed` here so that the user is only redirected
  // to the welcome page once; they may still visit the page again with the direct link
  useEffect(() => {
    // cannot put this after isAllLoaded because useEffect must not be
    // conditionally instantiated
    if (!isAllLoaded([m, r])) {
      return;
    }
    const membership = activeMembershipForClub(m.data!, r.data!.id);
    if (membership !== null && !membership.isWelcomed) {
      void setMembershipAsWelcomed.mutate({
        membershipId: membership.id
      });
    }
  }, [m, r]);

  useEffect(() => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  }, []);

  if (!isAllLoaded([r, u, m])) {
    return null;
  }

  // only active members can view this page
  const membership = activeMembershipForClub(m.data!, r.data!.id);
  if (null === membership) {
    throw new Error(`user is not an active member of club ${r.data!.id}`);
  }

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
    <Center pt={30}>
      <Stack align="center" gap="xl" mt={"xl"}>
        <Title order={2}>You've been approved!</Title>

        <Group gap="xl">
          <UserAvatar size={"lg"} user={u.data!} />
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

          <SecondaryButton onClick={() => router.push(`/join/${publicId}`)}>
            Enter
          </SecondaryButton>
        </Stack>
      </Stack>
    </Center>
  );
}
