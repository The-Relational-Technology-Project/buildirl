"use client";

import {
  Stack,
  Title,
  Text,
  useMatches,
  TitleOrder,
  Paper,
  Box,
  Center
} from "@mantine/core";
import { Carousel } from "@mantine/carousel";
import { useParams, useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { QueryError } from "~/client/utils/QueryError";
import { isLoaded } from "~/client/utils";
import WithLocalNavigationHeader from "~/client/components/WithLocalNavigationHeader";
import { useMounted } from "@mantine/hooks";
import { MembershipTier } from "~/server/membershipTier/types";
import { MembershipTierCarousel } from "~/client/components/MembershipTierCarousel";

const contributionCards = [
  { label: "VENUE" },
  { label: "FOOD" },
  { label: "TIME + EFFORT" }
];

export default function ClubTiers() {
  const titleOrder = useMatches<TitleOrder>({ base: 2, md: 1 });
  const titleAndCardGap = useMatches({ base: "lg", md: "xl" });
  const mounted = useMounted();
  const router = useRouter();

  const params = useParams<{ publicId: string }>();

  const club = api.main.clubByPublicId.useQuery({
    publicId: params.publicId
  });

  QueryError.check({
    result: club,
    fieldName: "clubByPublicId"
  });

  if (!isLoaded(club)) {
    return null;
  }

  const publishedTiers = club.data!.membershipTiers.filter(
    (t) => t.status === "PUBLISHED"
  );

  const handleTierSelect = (tier: MembershipTier) => {
    router.push(`/apply/${params.publicId}?membershipTierId=${tier.id}`);
  };

  return (
    mounted && (
      <WithLocalNavigationHeader>
        <Stack gap={titleAndCardGap}>
          <Stack align={"center"} gap={6} mb={"md"}>
            <Title ta="center" order={titleOrder}>
              Help keep this community alive!
            </Title>
            <Paper
              p="xs"
              radius="xs"
              shadow="none"
              style={{
                backgroundColor: "white",
                border: "2px solid #0f0f0f",
                boxShadow: "4px 6px 0 #0f0f0f",
                transform: "rotate(-2deg)",
                maxWidth: 500,
                marginTop: "12px"
              }}
            >
              <Text size="md" fw={500} ta="center" px="md" lh={1}>
                ✨ A little contribution, a big difference. ✨
              </Text>
            </Paper>
          </Stack>

          <MembershipTierCarousel
            tiers={publishedTiers}
            onTierSelect={handleTierSelect}
            buttonText="Select"
          />

          <Stack gap="md" align="center">
            <Text size={"sm"} ta="center">
              You’ll only be charged if your application is approved by the
              club. You may also withdraw your application after submitting.
            </Text>
            <ContributionReasonsCarousel />
          </Stack>
        </Stack>
      </WithLocalNavigationHeader>
    )
  );
}

function ContributionReasonsCarousel() {
  const isMobile = useMatches({ base: true, md: false });

  return (
    <Paper
      radius="xl"
      p={{ base: "md", md: 32 }}
      mb={"xl"}
      mt={"xl"}
      shadow="lg"
      style={{
        border: "2px solid #0d0d0d",
        boxShadow: isMobile ? "none" : "8px 10px 0 #0d0d0d",
        backgroundColor: "#fffdf4",
        width: "100%",
        maxWidth: 1200
      }}
    >
      <Stack gap="lg" align="center">
        <Stack gap={4} align="center">
          <Title order={2} ta="center">
            Why do we ask for contributions?
          </Title>
          <Text size="sm" c="dimmed" ta="center">
            Tap a card to learn more about why this club has memberships.
          </Text>
        </Stack>

        <Carousel
          slideSize="33.333333%"
          slideGap="md"
          align={isMobile ? "center" : "start"}
          withIndicators={isMobile}
          withControls
          styles={{
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
            container: {
              paddingTop: 8,
              paddingBottom: 8
            },
            ...(isMobile
              ? {
                  indicator: {
                    backgroundColor: "black",
                    width: 8,
                    height: 8
                  }
                }
              : {})
          }}
          px={{ base: 0, md: 48 }}
          pb={{ base: 60, md: 0 }}
        >
          {contributionCards.map((card) => (
            <Carousel.Slide key={card.label}>
              <ContributionCard label={card.label} />
            </Carousel.Slide>
          ))}
        </Carousel>
      </Stack>
    </Paper>
  );
}

function ContributionCard({ label }: { label: string }) {
  return (
    <Box
      h={300}
      w={250}
      style={{
        position: "relative",
        borderRadius: 26,
        overflow: "hidden",
        border: "3px solid #0d0d0d",
        boxShadow: "8px 8px 0 #0d0d0d",
        backgroundColor: "#e6f4d7"
      }}
    >
      <Box
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.03) 0%, rgba(0,0,0,0.15) 100%)"
        }}
      />
      <Center
        style={{
          position: "absolute",
          inset: 0
        }}
      >
        <Text
          fw={700}
          tt="uppercase"
          size="lg"
          px="xl"
          py={4}
          style={{
            backgroundColor: "#d2f377",
            borderRadius: 999,
            border: "2px solid #0d0d0d",
            letterSpacing: 0.3
          }}
        >
          {label}
        </Text>
      </Center>
    </Box>
  );
}
