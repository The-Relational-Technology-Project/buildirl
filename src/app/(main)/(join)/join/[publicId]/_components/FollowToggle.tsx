"use client";

import {
  Modal,
  Text,
  Box,
  Stack,
  Button,
  BoxProps,
  useMantineColorScheme,
  alpha
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { api } from "~/trpc/react";
import { isAllLoaded, isLoaded } from "~/client/utils";
import PrimaryButton from "~/client/components/PrimaryButton";
import { QueryError } from "~/client/utils/QueryError";
import { useRouter, useSearchParams } from "next/navigation";
import { handleDefaultMutationError } from "~/client/logger";
import { explicitlyParseTruthyBoolean } from "~/utils";

type FollowToggleProps = {
  clubId: number;
  // the path they will be redirect back to if they are after authentication
  // this should just be the path of the page displaying this toggle
  redirectTo: string;
};

export default function FollowToggle({
  clubId,
  redirectTo,
  ...props
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
    <AuthenticatedFollowToggle clubId={clubId} {...props} />
  ) : (
    <Box {...props}>
      <FollowToggleButton
        isFollowing={false}
        onClick={() =>
          router.push(
            `/login?redirect=${encodeURIComponent(redirectTo)}&followModalOpened=true`
          )
        }
      />
    </Box>
  );
}

type FollowToggleButtonProps = {
  isFollowing: boolean;
  onClick: () => void;
};

function FollowToggleButton({ isFollowing, onClick }: FollowToggleButtonProps) {
  const { colorScheme } = useMantineColorScheme();
  return (
    <Button
      variant={"filled"}
      color={
        colorScheme === "dark" ? alpha("#000000", 0.4) : alpha("#FFFFFF", 0.6)
      }
      size={"md"}
      onClick={onClick}
    >
      <Text c={colorScheme === "dark" ? "white" : "black"}>
        {isFollowing ? "Unfollow 🚪" : "Curious? 👀 Follow us 🔔"}
      </Text>
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const followModalOpened = explicitlyParseTruthyBoolean(
    searchParams.get("followModalOpened")
  );
  const [opened, { open, close }] = useDisclosure(followModalOpened);
  const utils = api.useUtils();

  const followedClubs = api.main.userFollowedClubs.useQuery();
  const memberships = api.main.userMemberships.useQuery();

  QueryError.check({
    result: followedClubs,
    fieldName: "userFollowedClubs"
  });

  QueryError.check({
    result: memberships,
    fieldName: "userMemberships"
  });

  const followMutation = api.main.followClub.useMutation({
    onSuccess: () => {
      utils.main.userFollowedClubs.invalidate();
      onClose();
    },
    onError: (e) => {
      handleDefaultMutationError(e);
      onClose();
    }
  });

  const unfollowMutation = api.main.unfollowClub.useMutation({
    onSuccess: () => {
      utils.main.userFollowedClubs.invalidate();
      onClose();
    },
    onError: (e) => {
      handleDefaultMutationError(e);
      onClose();
    }
  });

  if (!isAllLoaded([followedClubs, memberships])) {
    return null;
  }

  const isActiveMember = memberships.data!.some(
    (m) => m.club.id === clubId && m.status === "ACTIVE"
  );

  // active members cannot follow the club
  if (isActiveMember) {
    return null;
  }

  const isFollowing = followedClubs.data!.some((c) => c.id === clubId);

  const onClose = () => {
    // change url without scrolling page to top
    router.push(`?followModalOpened=false`, { scroll: false });
    close();
  };

  const onOpen = () => {
    // change url without scrolling page to top
    router.push(`?followModalOpened=true`, { scroll: false });
    open();
  };

  const handleConfirm = () => {
    if (isFollowing) {
      unfollowMutation.mutate({ clubId });
    } else {
      followMutation.mutate({ clubId });
    }
  };

  return (
    <Box {...props}>
      <FollowToggleButton isFollowing={isFollowing} onClick={onOpen} />

      <Modal opened={opened} onClose={onClose} centered>
        <Stack p={"sm"} align={"center"}>
          <Text size="md" mb="lg">
            {isFollowing
              ? "Are you sure you want to unfollow this club? You will no longer receive updates."
              : "By following this club, you agree to share your email with the club lead for further outreach and updates."}
          </Text>

          <PrimaryButton w={200} size={"md"} onClick={handleConfirm}>
            {"Confirm"}
          </PrimaryButton>
        </Stack>
      </Modal>
    </Box>
  );
}
