"use client";

import { useSearchParams } from "next/navigation";
import { api } from "~/trpc/react";
import {
  Box,
  Paper,
  Stack,
  Text,
  Title,
  useMantineColorScheme,
  useMantineTheme
} from "@mantine/core";
import PrimaryButton from "~/client/components/PrimaryButton";
import { strictParseBigInt } from "~/utils";
import { CheckoutFlowType } from "~/utils/types";
import React from "react";
import { handleDefaultMutationError } from "~/client/logger";

export default function IntakePaymentsPage() {
  const searchParams = useSearchParams();
  const membershipId = strictParseBigInt(searchParams.get("membershipId"));
  const utils = api.useUtils();
  const { colorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();
  const isDark = colorScheme === "dark";
  const accentColor = isDark
    ? theme.colors.lilac?.[2] ?? theme.colors.indigo[2]
    : theme.colors.lilac?.[7] ?? theme.colors.indigo[7];
  const bodyTextColor = isDark ? theme.other.dark.text : undefined;
  const mutedTextColor = isDark ? theme.other.dark.textMuted : "dimmed";
  const sectionBackground = isDark
    ? theme.other.dark.surface
    : theme.colors.beige?.[1] ?? theme.white;
  const sectionBorder = isDark
    ? `1px solid ${theme.other.dark.borderStrong}`
    : "2px solid #000";
  const sectionShadow = isDark
    ? `6px 6px 0px ${theme.other.dark.shadow}`
    : "6px 6px 0px #000";
  const sectionBorderRadius = 15;

  const createCheckoutSession = api.payments.createCheckoutSession.useMutation({
    onSuccess: (r) => {
      // after checkout completion, membership will move from
      // PENDING_INCOMPLETE -> PENDING state
      utils.main.userMemberships.invalidate();
      window.location.href = r.redirectUrl;
    },
    onError: handleDefaultMutationError
  });

  return (
    // this box matches general layout of intake/page.tsx
    <Box pt={{ base: 100, md: 120 }} px={{ base: undefined, md: 180 }}>
      <Paper
        p={"xl"}
        bg={sectionBackground}
        style={{
          border: sectionBorder,
          boxShadow: sectionShadow,
          borderRadius: sectionBorderRadius,
          color: bodyTextColor
        }}
      >
        <Stack>
          <Title order={4} c={accentColor}>
            Almost there!
          </Title>

          <Text size="sm" c={bodyTextColor}>
            {`Your support matters - dues help keep our club alive.`}
          </Text>

          <Text size="sm" c={bodyTextColor}>
            {"Add your payment info to finish up the application! 🎉"}
          </Text>

          <Text size="sm" c={mutedTextColor}>
            Don’t worry, you won’t be charged until you’re officially in.
          </Text>
          <Box style={{ alignSelf: "center" }} mt={"md"}>
            <PrimaryButton
              onClick={async () =>
                createCheckoutSession.mutateAsync({
                  input: { 
                    origin: window.location.origin, 
                    flowType: CheckoutFlowType.APPLICATION 
                  },
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
