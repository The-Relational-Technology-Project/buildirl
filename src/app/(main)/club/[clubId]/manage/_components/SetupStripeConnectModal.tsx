import { Box, Button, Modal, Stack, Text } from "@mantine/core";
import { useRouter } from "next/navigation";
import React from "react";

type SetupStripeConnectModalProps = {
  clubId: number;
  opened: boolean;
  handleClose: () => void;
};

export default function SetupStripeConnectModal({
  clubId,
  opened,
  handleClose
}: SetupStripeConnectModalProps) {
  const router = useRouter();

  const onSetupStripeConnectClick = () => {
    router.push(`/club/${clubId}/manage?tab=stripe-connect`);
    handleClose();
  };

  return (
    <Modal
      padding={"xl"}
      yOffset={200}
      opened={opened}
      onClose={handleClose}
      title={
        <Text size={"lg"} fw={700}>
          Setup Stripe Connect
        </Text>
      }
    >
      <Stack align={"center"}>
        <Text size={"md"}>
          Before creating membership tiers, you need to complete your Stripe
          Connect account setup to be able to receive payments from members.
        </Text>
        <Box mt={"md"}>
          <Button onClick={onSetupStripeConnectClick}>
            Setup Stripe Connect
          </Button>
        </Box>
      </Stack>
    </Modal>
  );
}
