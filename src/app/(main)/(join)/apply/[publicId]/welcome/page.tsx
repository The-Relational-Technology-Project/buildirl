"use client";

import { Stack, Title, Center, Image, Box } from "@mantine/core";
import confetti from "canvas-confetti";
import { useParams, useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { QueryError } from "~/client/utils/QueryError";
import { isAllLoaded } from "~/client/utils";
import { useEffect } from "react";
import ClubImage from "~/client/components/ClubImage";
import SecondaryButton from "~/client/components/SecondaryButton";
import { activeMembershipForClub } from "~/utils/types";
import UserAvatar from "~/client/components/UserAvatar";
import PrimaryButton, {
  BUTTON_STANDARD_WIDTH
} from "~/client/components/PrimaryButton";
import UserClubHandshake from "~/client/components/UserClubHandshake";

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
    <Center pt={50}>
      <Stack align="center" gap="xl" mt={"xl"}>
        <Title order={2} style={{ textAlign: "center" }}>
          YOU'VE BEEN APPROVED!
        </Title>

        <UserClubHandshake user={u.data!} club={r.data!} />

        <Stack gap={"sm"} align={"center"}>
          <Title order={3} fw={400} style={{ textAlign: "center" }}>
            Welcome {u.data!.firstName}!
          </Title>
          <Title order={3} fw={400}>
            You Are Now a Member Of
          </Title>
          <Title order={3} style={{ textAlign: "center" }}>
            {r.data!.name}!
          </Title>
        </Stack>

        <Title order={3} fw={400}>
          Celebrate Publicly!
        </Title>

        <Stack align="center" gap="md" w={"100%"}>
          <PrimaryButton w={BUTTON_STANDARD_WIDTH} onClick={onShare}>
            Share
          </PrimaryButton>

          <SecondaryButton
            w={BUTTON_STANDARD_WIDTH}
            onClick={() => router.push(`/join/${publicId}`)}
          >
            Enter
          </SecondaryButton>
        </Stack>
      </Stack>
    </Center>
  );
}
