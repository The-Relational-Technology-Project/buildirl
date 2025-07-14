"use client";

import {
  Paper,
  Stack,
  Title,
  Text,
  Box,
  Space,
  useMatches,
  useMantineColorScheme,
} from "@mantine/core";
import { Carousel } from "@mantine/carousel";
import { MembershipTier } from "~/server/membershipTier/types";
import { formatBillingInterval } from "~/client/utils";
import PrimaryButton from "~/client/components/PrimaryButton";

interface MembershipTierCarouselProps {
  tiers: MembershipTier[];
  onTierSelect: (tier: MembershipTier) => void;
  buttonText?: string;
  buttonColor?: string;
  excludeTierId?: number;
}

export function MembershipTierCarousel({
  tiers,
  onTierSelect,
  buttonText = "Select",
  buttonColor = "lilac",
  excludeTierId,
}: MembershipTierCarouselProps) {
  const isMobile = useMatches({ base: true, md: false });
  const withCarouselControls = useMatches({ base: false, md: true });
  const { colorScheme } = useMantineColorScheme();

  const displayTiers = excludeTierId 
    ? tiers.filter(t => t.id !== excludeTierId)
    : tiers;

  return (
    <Carousel
      slideSize="33.333333%"
      slideGap="md"
      align="center"
      withControls={withCarouselControls}
      withIndicators={isMobile && displayTiers.length > 1}
      styles={
        isMobile && displayTiers.length > 1
          ? {
              indicator: {
                backgroundColor: `${colorScheme === "dark" ? "white" : "black"}`,
                width: 8,
                height: 8
              }
            }
          : undefined
      }
      pb={{ base: 60, md: 0 }}
    >
      {displayTiers.map((tier) => (
        <Carousel.Slide key={tier.id} py={4}>
          <MembershipTierCard
            membershipTier={tier}
            onSelect={() => onTierSelect(tier)}
            buttonText={buttonText}
            buttonColor={buttonColor}
          />
        </Carousel.Slide>
      ))}
    </Carousel>
  );
}

function costDisplayText(membershipTier: MembershipTier) {
  const cost = membershipTier.costPerBillingInterval;
  const interval = formatBillingInterval(membershipTier.billingInterval);
  const initiationFee = membershipTier.initiationFeeCostInUSD;

  let text = `${cost} / ${interval}`;
  if (initiationFee !== null && initiationFee > 0) {
    text += ` + ${initiationFee} initiation`;
  }
  return text;
}

interface MembershipTierCardProps {
  membershipTier: MembershipTier;
  onSelect: () => void;
  buttonText: string;
  buttonColor: string;
}

function MembershipTierCard({
  membershipTier,
  onSelect,
  buttonText,
  buttonColor,
}: MembershipTierCardProps) {
  return (
    <Paper key={membershipTier.id} h={425} w={300} p={"lg"}>
      <Stack h={"100%"} gap={10}>
        <Title order={3}>{membershipTier.name}</Title>

        <Stack style={{ overflowY: "auto" }}>
          {membershipTier.benefitDescription !== "" && (
            <Stack gap={4}>
              <Title order={6}>Our member experience</Title>
              <Box mih={72}>
                <Text size="sm">{membershipTier.benefitDescription}</Text>
              </Box>
            </Stack>
          )}

          {membershipTier.contributionDescription !== "" && (
            <Stack gap={4}>
              <Title order={6}>Your contribution is key!</Title>
              <Box mih={72}>
                <Text size="sm">{membershipTier.contributionDescription}</Text>
              </Box>
            </Stack>
          )}
        </Stack>

        <Space flex={1} />

        <Stack>
          <Text size="lg" fw={500}>
            {costDisplayText(membershipTier)}
          </Text>

          <Box style={{ alignSelf: "center" }}>
            <PrimaryButton
              size={"lg"}
              w={200}
              color={buttonColor}
              onClick={onSelect}
            >
              {buttonText}
            </PrimaryButton>
          </Box>
        </Stack>
      </Stack>
    </Paper>
  );
}