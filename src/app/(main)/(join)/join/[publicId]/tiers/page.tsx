"use client";

import {
  Stack,
  Title,
  Text,
  useMatches,
  useMantineColorScheme,
  useMantineTheme,
  TitleOrder,
  Paper,
  Box,
  Center,
  Group
} from "@mantine/core";
import { Carousel } from "@mantine/carousel";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { api } from "~/trpc/react";
import { QueryError } from "~/client/utils/QueryError";
import { isLoaded } from "~/client/utils";
import WithLocalNavigationHeader from "~/client/components/WithLocalNavigationHeader";
import { useMounted } from "@mantine/hooks";
import { MembershipTier } from "~/server/membershipTier/types";
import { MembershipTierCarousel } from "~/client/components/MembershipTierCarousel";
import { ContributionReason } from "~/server/club/types";

const scrollToElementSlowly = (element: HTMLElement, duration = 900) => {
  const startY = window.scrollY;
  const targetY = element.getBoundingClientRect().top + window.scrollY;
  const distance = targetY - startY;
  const startTime = performance.now();

  const easeInOutQuad = (t: number) =>
    t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

  const step = (currentTime: number) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = easeInOutQuad(progress);

    window.scrollTo(0, startY + distance * easedProgress);

    if (elapsed < duration) {
      requestAnimationFrame(step);
    }
  };

  requestAnimationFrame(step);
};

export default function ClubTiers() {
  const titleOrder = useMatches<TitleOrder>({ base: 2, md: 1 });
  const titleAndCardGap = useMatches({ base: "lg", md: "xl" });
  const isDesktop = useMatches({ base: false, md: true });
  const { colorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();
  const isDark = colorScheme === "dark";
  const mounted = useMounted();
  const router = useRouter();
  const contributionReasonsRef = useRef<HTMLDivElement>(null);

  const params = useParams<{ publicId: string }>();

  const club = api.main.clubByPublicId.useQuery({
    publicId: params.publicId
  });

  QueryError.check({
    result: club,
    fieldName: "clubByPublicId"
  });

  useEffect(() => {
    if (!mounted) return;
    if (typeof window === "undefined") return;
    if (window.location.hash === "#contribution-reasons") {
      const target = contributionReasonsRef.current;
      if (target) {
        scrollToElementSlowly(target);
      }
    }
  }, [mounted]);

  if (!isLoaded(club)) {
    return null;
  }

  const publishedTiers = club.data!.membershipTiers.filter(
    (t) => t.status === "PUBLISHED"
  );
  const shouldCenterDesktopCarousel = isDesktop && publishedTiers.length <= 3;
  const contributionReasons = club.data!.contributionReasons.items;
  const hasContributionReasons = contributionReasons.length > 0;

  const handleTierSelect = (tier: MembershipTier) => {
    router.push(`/apply/${params.publicId}?membershipTierId=${tier.id}`);
  };

  return (
    mounted && (
      <WithLocalNavigationHeader>
        <Stack gap={titleAndCardGap} px={{ base: 0, md: 56 }}>
          <Stack align={"center"} gap={6} mb={"sm"}>
            <Title ta="center" order={titleOrder}>
              Help keep this community alive!
            </Title>
          </Stack>

          <MembershipTierCarousel
            tiers={publishedTiers}
            onTierSelect={handleTierSelect}
            buttonText="Select"
            alignDesktop={shouldCenterDesktopCarousel ? "center" : undefined}
            withDesktopControls={
              shouldCenterDesktopCarousel ? false : undefined
            }
            accentColor={club.data!.accentColor}
          />

          <Stack gap="md" align="center">
            <Text
              size={"sm"}
              ta="center"
              mb={!hasContributionReasons ? "24px" : "0"}
            >
              You’ll only be charged if your application is approved by the
              club. You may also withdraw your application after submitting.
            </Text>
            {hasContributionReasons ? (
              <Box ref={contributionReasonsRef} style={{ width: "100%" }}>
                <ContributionReasonsCarousel
                  contributionReasons={contributionReasons}
                />
              </Box>
            ) : null}
            <Paper
              p="xs"
              radius="xs"
              shadow="none"
              style={{
                backgroundColor: isDark
                  ? theme.other.dark.surfaceAlt
                  : "white",
                border: isDark
                  ? `2px solid ${theme.other.dark.borderStrong}`
                  : "2px solid #0f0f0f",
                boxShadow: isDark
                  ? `4px 6px 0 ${theme.other.dark.shadow}`
                  : "4px 6px 0 #0f0f0f",
                // transform: "rotate(-2deg)",
                color: isDark ? theme.other.dark.text : "#0f0f0f",
                maxWidth: 500,
                marginBottom: 96
              }}
            >
              <Text size="md" fw={500} ta="center" px="md" lh={1}>
                ✨ A little contribution, a big difference. ✨
              </Text>
            </Paper>
          </Stack>
        </Stack>
      </WithLocalNavigationHeader>
    )
  );
}

function ContributionReasonsCarousel({
  contributionReasons
}: {
  contributionReasons: ContributionReason[];
}) {
  const isMobile = useMatches({ base: true, md: false });
  const isDesktop = useMatches({ base: false, md: true });
  const shouldCenterDesktopCards = isDesktop && contributionReasons.length <= 3;
  if (contributionReasons.length === 0) return null;

  return (
    <Paper
      radius="xl"
      p={{ base: "md", md: 32 }}
      mb={"48"}
      mt={"xl"}
      mx="auto"
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

        {shouldCenterDesktopCards ? (
          <Group justify="center" align="flex-start" gap="lg" w="100%" py="md">
            {contributionReasons.map((reason, index) => (
              <ContributionCard
                key={`${reason.label}-${index}`}
                contributionReason={reason}
              />
            ))}
          </Group>
        ) : (
          <Carousel
            slideSize="33.333333%"
            slideGap="lg"
            align={isMobile ? "center" : "start"}
            withIndicators={isMobile && contributionReasons.length > 1}
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
                paddingTop: 16,
                paddingBottom: 16,
                paddingLeft: 48
              },
              ...(isMobile && contributionReasons.length > 1
                ? {
                    indicator: {
                      backgroundColor: "black",
                      width: 8,
                      height: 8
                    }
                  }
                : {})
            }}
            px={{ base: 0, md: 72 }}
            pb={{ base: 60, md: 0 }}
          >
            {contributionReasons.map((reason, index) => (
              <Carousel.Slide key={`${reason.label}-${index}`}>
                <ContributionCard contributionReason={reason} />
              </Carousel.Slide>
            ))}
          </Carousel>
        )}
      </Stack>
    </Paper>
  );
}

const FALLBACK_CONTRIBUTION_COLOR = "#e6f4d7";

function ContributionCard({
  contributionReason
}: {
  contributionReason: ContributionReason;
}) {
  const [flipped, setFlipped] = useState(false);
  const { label, description, coverImageUrl } = contributionReason;

  const handleToggle = () => setFlipped((prev) => !prev);

  return (
    <Box h={300} w={250} style={{ perspective: 1000 }}>
      <Box
        role="button"
        tabIndex={0}
        onClick={handleToggle}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            handleToggle();
          }
        }}
        aria-pressed={flipped}
        style={{
          position: "relative",
          height: "100%",
          width: "100%",
          borderRadius: 26,
          cursor: "pointer",
          transformStyle: "preserve-3d",
          transition: "transform 0.6s ease",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          boxShadow: "8px 8px 0 #0d0d0d"
        }}
      >
        <Box
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 26,
            border: "3px solid #0d0d0d",
            overflow: "hidden",
            backgroundColor: FALLBACK_CONTRIBUTION_COLOR,
            backgroundImage: coverImageUrl
              ? `linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.35) 100%), url(${coverImageUrl})`
              : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backfaceVisibility: "hidden"
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

        <Box
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 26,
            border: "3px solid #0d0d0d",
            overflow: "hidden",
            backgroundColor: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1.5rem",
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)"
          }}
        >
          <Text ta="center" fw={600} c="#0d0d0d">
            {description}
          </Text>
        </Box>
      </Box>
    </Box>
  );
}
