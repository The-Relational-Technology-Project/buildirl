"use client";

import { useSearchParams } from "next/navigation";
import { api } from "~/trpc/react";
import { Box, Paper, Stack, Text, Title } from "@mantine/core";
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
          <Title order={4}>Almost there!</Title>

          <Text size="sm">
            {`Your support matters. Dues help keep our club alive — but don’t
            worry, you won’t be charged until you’re officially in.`}
          </Text>

          <Text size="sm">
            {"Add your payment info to finish up the application! 🎉"}
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
              {"Let's Do This!"}
            </PrimaryButton>
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
}
