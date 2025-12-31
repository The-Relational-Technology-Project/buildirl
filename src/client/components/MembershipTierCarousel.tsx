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
  Group,
  Badge,
  Button
} from "@mantine/core";
import { Carousel } from "@mantine/carousel";
import { MembershipTier } from "~/server/membershipTier/types";
import { billingIntervalLabel } from "~/client/utils";

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

  if (isMobile) {
    return (
      <Stack gap="md" w="100%">
        {tiers.map((tier) => (
          <MembershipTierCard
            key={tier.id}
            membershipTier={tier}
            onSelect={() => onTierSelect(tier)}
            buttonText={buttonText}
            disabled={tier.id === excludedTierId}
            fullWidth
          />
        ))}
      </Stack>
    );
  }

  return (
    <Carousel
      slideSize="33.333333%"
      slideGap="md"
      align={isMobile ? "center" : "start"}
      // we need indicators for mobile because
      // the next and previous card are not visible
      withControls={withCarouselControls}
      withIndicators={isMobile && tiers.length > 1}
      withKeyboardEvents={true}
      styles={{
        // TODO! there is a bug with default control color in the deployed environments
        //  change the control color to make it visible
        control: {
          width: "3rem",
          height: "3rem",
          backgroundColor: "white",
          color: "black",
          opacity: 1,
          border: "2px solid",
          borderColor: "black",
          borderRadius: "4px"
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
      px={{ base: 0, md: 72 }}
    >
      {tiers.map((tier) => (
        <Carousel.Slide key={tier.id} py={8}>
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

interface MembershipTierCardProps {
  membershipTier: MembershipTier;
  onSelect: () => void;
  buttonText: string;
  disabled: boolean;
  fullWidth?: boolean;
}

function MembershipTierCard({
  membershipTier,
  onSelect,
  buttonText,
  disabled,
  fullWidth = false
}: MembershipTierCardProps) {
  const monthlyCost = `$${membershipTier.costPerBillingInterval} / ${billingIntervalLabel(membershipTier.billingInterval)}`;
  const initiationFee =
    membershipTier.initiationFeeCostInUSD !== null &&
    membershipTier.initiationFeeCostInUSD > 0
      ? `$${membershipTier.initiationFeeCostInUSD} initiation fee`
      : null;
  const ctaLabel =
    `${buttonText ?? "Select"} ${membershipTier.name.toUpperCase()}`.trim();

  return (
    <Paper
      key={membershipTier.id}
      h={520}
      w={fullWidth ? "100%" : 320}
      radius="lg"
      style={{
        overflow: "hidden",
        boxShadow: "6px 6px 0px #000",
        border: "2px solid #000",
        transition: "transform 0.1s ease, box-shadow 0.1s ease"
      }}
      onMouseDown={(e) => {
        e.currentTarget.style.transform = "translate(4px, 4px)";
        e.currentTarget.style.boxShadow = "2px 2px 0px #000";
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = "translate(0, 0)";
        e.currentTarget.style.boxShadow = "6px 6px 0px #000";
      }}
    >
      <Stack h={"100%"} gap={0}>
        <Box
          h={160}
          style={{
            position: "relative",
            backgroundImage:
              "linear-gradient(135deg, #1f1b2c 0%, #5a3b33 45%, #d47d38 100%)",
            backgroundSize: "cover"
          }}
        >
          <Group
            gap="sm"
            px="md"
            py="sm"
            style={{ position: "absolute", top: 0 }}
          >
            <Badge
              radius="xl"
              color="#ffe680"
              variant="filled"
              fz={"sm"}
              ff={"text"}
              py={"sm"}
              bd={"1px solid black"}
              style={{ color: "#0d0d0d", fontWeight: 600 }}
            >
              {monthlyCost}
            </Badge>
            {initiationFee && (
              <Badge
                color="#ffe680"
                variant="filled"
                fz={"sm"}
                ff={"text"}
                py={"sm"}
                bd={"1px solid black"}
                style={{ color: "#0d0d0d", fontWeight: 600 }}
              >
                {initiationFee}
              </Badge>
            )}
          </Group>
        </Box>

        <Stack
          h={"100%"}
          p={"lg"}
          gap="md"
          style={{ borderTop: "1px solid #0d0d0d", flex: 1 }}
        >
          <Box>
            <Title order={3} style={{ letterSpacing: 0.3 }}>
              {membershipTier.name.toUpperCase()}
            </Title>
            {membershipTier.benefitDescription !== "" && (
              <Box mt={8}>
                <Text size="md">{membershipTier.benefitDescription}</Text>
              </Box>
            )}
          </Box>

          <Space flex={1} />

          <Stack gap={6}>
            <Text size="sm" c="dimmed" fw={600} style={{ letterSpacing: 0.6 }}>
              Impact: ⭐️
            </Text>
            {/* <Box style={{ borderTop: "1px solid #c9c3b4" }} /> */}
            <Button
              onClick={onSelect}
              disabled={disabled}
              radius="md"
              color="yellow"
              size="lg"
              styles={{
                root: {
                  position: "relative",
                  isolation: "isolate",
                  color: "#0d0d0d",
                  border: "2px solid #0d0d0d",
                  backgroundColor: "#ffe680"
                }
              }}
            >
              {ctaLabel}
            </Button>
          </Stack>
        </Stack>
      </Stack>
    </Paper>
  );
}
