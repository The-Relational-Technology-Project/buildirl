"use client";

import { useSearchParams } from "next/navigation";
import { api } from "~/trpc/react";
import { Box, Paper, Stack, Text } from "@mantine/core";
import PrimaryButton from "~/client/components/PrimaryButton";
import { strictParseBigInt } from "~/utils";
import React from "react";

export default function IntakePaymentsPage() {
  const searchParams = useSearchParams();
  const membershipId = strictParseBigInt(searchParams.get("membershipId"));
  const utils = api.useUtils();

  const createCheckoutSession = api.payments.createCheckoutSession.useMutation({
    onSuccess: (r) => {
      // after checkout completion, membership will move from
      // PENDING_INCOMPLETE -> PENDING state
      utils.main.userMemberships.invalidate();
      window.location.href = r.redirectUrl;
    }
  });

  return (
    // this box matches general layout of intake/page.tsx
    <Box pt={{ base: 100, md: 120 }} px={{ base: undefined, md: 180 }}>
      <Paper p={"xl"}>
        <Stack>
          <Text fw={500}>
            Almost there! Your application is still in progress.
          </Text>

          <Text size="sm">
            Your support matters. The dues help keep our club alive!
          </Text>

          <Text size="sm">
            You’ll only start paying dues once you're officially in. We won’t
            begin your contributions until your membership is accepted by the
            club.
          </Text>

          <Box style={{ alignSelf: "center" }} mt={"md"}>
            <PrimaryButton
              onClick={async () =>
                createCheckoutSession.mutateAsync({
                  input: { origin: window.location.origin },
                  membershipId: membershipId.toString()
                })
              }
              loading={createCheckoutSession.isPending}
              size={"sm"}
              w={200}
            >
              Submit Payment Details
            </PrimaryButton>
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
}
