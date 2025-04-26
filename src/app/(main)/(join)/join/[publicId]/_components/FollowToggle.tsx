"use client";

import { Modal, Text, Box, Stack, Button, BoxProps } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { api } from "~/trpc/react";
import { isAllLoaded, isLoaded } from "~/client/utils";
import PrimaryButton from "~/client/components/PrimaryButton";
import { QueryError } from "~/client/utils/QueryError";
import { useRouter } from "next/navigation";

type FollowToggleProps = {
  clubId: number;
  // the path they will be redirect back to if they are after authentication
  // this should just be the path of the page displaying this toggle
  redirectTo: string;
};

export default function FollowToggle({
  clubId,
  redirectTo
}: FollowToggleProps & BoxProps) {
  const router = useRouter();
  const isAuthenticated = api.main.isUserAuthenticated.useQuery(undefined, {
    // we want to ensure when users are redirected back after login that
    // they immediately have the authenticated follow toggle
    staleTime: 0
  });

  QueryError.check({
    result: isAuthenticated,
    fieldName: "isUserAuthenticated"
  });

  if (!isLoaded(isAuthenticated)) {
    return null;
  }

  return isAuthenticated.data ? (
    <AuthenticatedFollowToggle clubId={clubId} />
  ) : (
    <FollowToggleButton
      isFollowing={false}
      onClick={() =>
        router.push(`/login?redirect=${encodeURIComponent(redirectTo)}`)
      }
    />
  );
}

type FollowToggleButtonProps = {
  isFollowing: boolean;
  onClick: () => void;
};

function FollowToggleButton({ isFollowing, onClick }: FollowToggleButtonProps) {
  return (
    <Button variant={"transparent"} size={"md"} onClick={onClick}>
      <Text>{isFollowing ? "Unfollow 🚪" : "Curious? 👀 Follow us 🔔"}</Text>
    </Button>
  );
}

type AuthenticatedFollowToggleProps = {
  clubId: number;
};

function AuthenticatedFollowToggle({
  clubId,
  ...props
}: AuthenticatedFollowToggleProps & BoxProps) {
  const [opened, { open, close }] = useDisclosure(false);
  const utils = api.useUtils();

  const followedClubs = api.main.userFollowedClubs.useQuery();
  const ownedClubs = api.main.userOwnedClubs.useQuery();
  const memberships = api.main.userMemberships.useQuery();

  QueryError.check({
    result: followedClubs,
    fieldName: "userFollowedClubs"
  });

  QueryError.check({
    result: ownedClubs,
    fieldName: "userOwnedClubs"
  });

  QueryError.check({
    result: memberships,
    fieldName: "userMemberships"
  });

  const followMutation = api.main.followClub.useMutation({
    onSuccess: () => {
      utils.main.userFollowedClubs.invalidate();
      close();
    }
  });

  const unfollowMutation = api.main.unfollowClub.useMutation({
    onSuccess: () => {
      utils.main.userFollowedClubs.invalidate();
      close();
    }
  });

  if (!isAllLoaded([followedClubs, ownedClubs, memberships])) {
    return null;
  }

  const isOwner = ownedClubs.data!.some((c) => c.id === clubId);
  const isActiveMember = memberships.data!.some(
    (m) => m.club.id === clubId && m.status === "ACTIVE"
  );

  // owners or active members cannot follow the club
  if (isOwner || isActiveMember) {
    return null;
  }

  const isFollowing = followedClubs.data!.some((c) => c.id === clubId);

  const handleConfirm = () => {
    if (isFollowing) {
      unfollowMutation.mutate({ clubId });
    } else {
      followMutation.mutate({ clubId });
    }
  };

  return (
    <Box {...props}>
      <FollowToggleButton isFollowing={isFollowing} onClick={open} />

      <Modal opened={opened} onClose={close} centered>
        <Stack p={"sm"} align={"center"}>
          <Text size="md" mb="lg">
            {isFollowing
              ? "Are you sure you want to unfollow this club? You will no longer receive updates."
              : "By following this club, you agree to share your email with the club owner for further outreach and updates."}
          </Text>

          <PrimaryButton w={200} size={"md"} onClick={handleConfirm}>
            {"Confirm"}
          </PrimaryButton>
        </Stack>
      </Modal>
    </Box>
  );
}
