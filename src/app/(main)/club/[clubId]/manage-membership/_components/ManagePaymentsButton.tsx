import { Box, BoxProps, Button } from "@mantine/core";
import React from "react";
import { api } from "~/trpc/react";
import { handleDefaultMutationError } from "~/client/logger";

type ManagePaymentsButtonProps = {
  membershipId: bigint;
};

export default function ManagePaymentsButton({
  membershipId,
  ...props
}: ManagePaymentsButtonProps & BoxProps) {
  const createCustomerPortalSession =
    api.payments.createCustomerPortalSession.useMutation({
      onSuccess: (r) => {
        window.location.href = r.redirectUrl;
      },
      onError: handleDefaultMutationError
    });

  return (
    <Box {...props}>
      <Button
        onClick={async () => {
          await createCustomerPortalSession.mutateAsync({
            input: { origin: window.location.origin },
            membershipId: membershipId.toString()
          });
        }}
        loading={createCustomerPortalSession.isPending}
      >
        Edit Payment Details
      </Button>
    </Box>
  );
}
