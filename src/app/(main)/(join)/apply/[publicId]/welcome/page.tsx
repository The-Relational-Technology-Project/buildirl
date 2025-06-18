"use client";

import { Stack, Title, Center } from "@mantine/core";
import confetti from "canvas-confetti";
import { useParams, useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { QueryError } from "~/client/utils/QueryError";
import { isAllLoaded } from "~/client/utils";
import { useEffect } from "react";
import SecondaryButton from "~/client/components/SecondaryButton";
import { activeMembershipForClub } from "~/utils/types";
import PrimaryButton from "~/client/components/PrimaryButton";
import UserClubHandshake from "~/client/components/UserClubHandshake";
import { handleDefaultMutationError } from "~/client/logger";

export default function Welcome() {
  const params = useParams<{ publicId: string }>();
  const publicId = params.publicId;
  const router = useRouter();

  const club = api.main.clubByPublicId.useQuery({ publicId });
  const user = api.main.user.useQuery();
  const userMemberships = api.main.userMemberships.useQuery();

  const utils = api.useUtils();
  const setMembershipAsWelcomed = api.main.setMembershipAsWelcomed.useMutation({
    onSuccess: () => {
      utils.main.userMemberships.invalidate();
    },
    onError: handleDefaultMutationError
  });

  QueryError.check({
    result: club,
    fieldName: "clubByPublicId"
  });

  QueryError.check({
    result: user,
    fieldName: "user"
  });

  QueryError.check({
    result: userMemberships,
    fieldName: "userMemberships"
  });

  useEffect(() => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  }, []);

  if (!isAllLoaded([club, user, userMemberships])) {
    return null;
  }

  // only active members can view this page
  const membership = activeMembershipForClub(
    userMemberships.data!,
    club.data!.id
  );
  if (null === membership) {
    throw new Error(`user is not an active member of club ${club.data!.id}`);
  }

  const onShare = () => {
    const shareUrl = `${window.location.origin}/join/${publicId}/share/${user.data!.id}`;
    if (navigator.share) {
      void navigator.share({
        title: `Join me at ${club.data!.name}!`,
        url: shareUrl
      });
    } else {
      window.open(shareUrl, "_blank");
    }
  };

  return (
    <Center pt={50}>
      {/* in desktop, we need to decrease margin top for vertical centering*/}
      <Stack align="center" gap="xl" mt={{ base: "xl", md: 0 }}>
        <Title order={1} ta={"center"}>
          {"YOU'VE BEEN APPROVED!"}
        </Title>

        <UserClubHandshake user={user.data!} club={club.data!} />

        <Stack gap={"sm"} align={"center"}>
          <Title order={2} fw={700} style={{ textAlign: "center" }}>
            Welcome {user.data!.firstName}!
          </Title>
          <Title order={3} fw={400}>
            {"You Are Now a Member Of"}
          </Title>
          <Title order={3} style={{ textAlign: "center" }}>
            {club.data!.name}!
          </Title>
        </Stack>

        <Title order={3} fw={400}>
          {"Celebrate Publicly!"}
        </Title>

        <Stack align="center" gap="md" w={"100%"}>
          <PrimaryButton onClick={onShare}>{"Share"}</PrimaryButton>

          <SecondaryButton
            onClick={async () => {
              // mark as welcomed
              await setMembershipAsWelcomed.mutateAsync({
                membershipId: membership!.id
              });
              // this is necessary because the mutation takes a bit to reflect
              // in the query, so we need this bit to ensure the user is not
              // redirected back here after clicking this
              router.push(`/join/${publicId}?fromWelcome=true`);
            }}
          >
            {"Enter"}
          </SecondaryButton>
        </Stack>
      </Stack>
    </Center>
  );
}
