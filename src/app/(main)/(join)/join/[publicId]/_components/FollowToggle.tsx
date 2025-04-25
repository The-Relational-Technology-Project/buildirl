"use client";

import { Modal, Text, Box, Stack, Button, BoxProps } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { api } from "~/trpc/react";
import { isAllLoaded } from "~/client/utils";
import PrimaryButton from "~/client/components/PrimaryButton";
import { QueryError } from "~/client/utils/QueryError";

interface FollowToggleProps {
  clubId: number;
}

export default function FollowToggle({
  clubId,
  ...props
}: FollowToggleProps & BoxProps) {
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
      <Button variant={"transparent"} size={"md"} onClick={open}>
        <Text>{isFollowing ? "Unfollow 🚪" : "Curious? 👀 Follow us 🔔"}</Text>
      </Button>

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
