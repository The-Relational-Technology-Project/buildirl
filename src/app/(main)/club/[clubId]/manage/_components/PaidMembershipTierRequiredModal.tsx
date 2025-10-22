import { Box, Button, Modal, Stack, Text } from "@mantine/core";
import { useRouter } from "next/navigation";
import React from "react";

type CreateTierRequiredModalProps = {
  clubId: number;
  opened: boolean;
  handleClose: () => void;
};

export default function PaidMembershipTierRequiredModal({
  clubId,
  opened,
  handleClose
}: CreateTierRequiredModalProps) {
  const router = useRouter();

  const onCreateTierClick = () => {
    router.push(`/club/${clubId}/manage?tab=memberships`);
    handleClose();
  };

  return (
    <Modal
      padding={"xl"}
      centered
      opened={opened}
      onClose={handleClose}
      title={
        <Text size={"lg"} fw={700}>
          Paid Membership Tier Required
        </Text>
      }
    >
      <Stack align={"center"}>
        <Text size={"md"}>
          Before creating a membership campaign, you need to create at least one
          paid membership tier.
        </Text>
        <Box mt={"md"}>
          <Button onClick={onCreateTierClick}>
            Create Paid Membership Tier
          </Button>
        </Box>
      </Stack>
    </Modal>
  );
}
