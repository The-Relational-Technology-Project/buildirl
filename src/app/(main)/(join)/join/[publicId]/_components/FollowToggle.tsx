"use client";

import { Modal, Text, Box, Stack, Button, BoxProps } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { api } from "~/trpc/react";
import { isLoaded } from "~/client/utils";
import SecondaryButton from "~/client/components/SecondaryButton";
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

  const utils = api.useContext();

  const r = api.main.userFollowedClubs.useQuery();

  QueryError.check({
    result: r,
    fieldName: "userFollowedClubs"
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

  if (!isLoaded(r)) {
    return null;
  }

  const isFollowing = r.data!.some((club) => club.id === clubId);

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
