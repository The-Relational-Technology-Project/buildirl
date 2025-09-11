"use client";

import {
  Paper,
  Stack,
  Title,
  Text,
  Box,
  Space,
  useMatches,
  useMantineColorScheme
} from "@mantine/core";
import { Carousel } from "@mantine/carousel";
import { MembershipTier } from "~/server/membershipTier/types";
import { billingIntervalLabel } from "~/client/utils";
import PrimaryButton from "~/client/components/PrimaryButton";

interface MembershipTierCarouselProps {
  tiers: MembershipTier[];
  onTierSelect: (tier: MembershipTier) => void;
  buttonText?: string;
  excludedTierId?: number;
}

export function MembershipTierCarousel({
  tiers,
  onTierSelect,
  buttonText = "Select",
  excludedTierId
}: MembershipTierCarouselProps) {
  const isMobile = useMatches({ base: true, md: false });
  const withCarouselControls = useMatches({ base: false, md: true });
  const { colorScheme } = useMantineColorScheme();

  return (
    <Carousel
      slideSize="33.333333%"
      slideGap="md"
      align="center"
      // we need indicators for mobile because
      // the next and previous card are not visible
      withControls={withCarouselControls}
      withIndicators={isMobile && tiers.length > 1}
      styles={{
        // TODO! there is a bug with default control color in the deployed environments
        //  change the control color to make it visible for both light and black themes
        control: {
          backgroundColor: "grey",
          color: "white"
        },
        ...(isMobile && tiers.length > 1
          ? {
              indicator: {
                backgroundColor: `${colorScheme === "dark" ? "white" : "black"}`,
                width: 8,
                height: 8
              }
            }
          : {})
      }}
      // shifts the indicator down
      pb={{ base: 60, md: 0 }}
    >
      {tiers.map((tier) => (
        <Carousel.Slide key={tier.id} py={4}>
          <MembershipTierCard
            membershipTier={tier}
            onSelect={() => onTierSelect(tier)}
            buttonText={buttonText}
            disabled={tier.id === excludedTierId}
          />
        </Carousel.Slide>
      ))}
    </Carousel>
  );
}

// it is intentional to omit dollar sign here as $ sign causes anxiety for consumers
function costDisplayText(membershipTier: MembershipTier) {
  const cost = membershipTier.costPerBillingInterval;
  const interval = billingIntervalLabel(membershipTier.billingInterval);
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
  disabled: boolean;
}

function MembershipTierCard({
  membershipTier,
  onSelect,
  buttonText,
  disabled
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
              color={"lilac"}
              onClick={onSelect}
              disabled={disabled}
            >
              {buttonText}
            </PrimaryButton>
          </Box>
        </Stack>
      </Stack>
    </Paper>
  );
}
