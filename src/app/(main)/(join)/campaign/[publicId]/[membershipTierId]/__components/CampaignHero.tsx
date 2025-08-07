// !! PROTOTYPE

"use client";

import {
  Stack,
  Title,
  Text,
  Card,
  Progress,
  Group,
  Badge,
  Box,
  Grid,
  Avatar,
  Center,
  Container,
  useMatches
} from "@mantine/core";
import {
  IconSparkles,
  IconMapPin,
  IconCalendar,
  IconUsers
} from "@tabler/icons-react";
import CTAButton from "./CTAButton";
import { BillingInterval } from "~/utils/types";
import { Membership } from "~/server/membership/types";
import { useRouter } from "next/navigation";

interface CampaignHeroProps {
  membershipTierId: number;
  membershipCostPerMonth: number;
  billingInterval: BillingInterval;
  goalAmount: number;
  supporters: Membership[];
  clubPublicId: string;
}

export default function CampaignHero({
  membershipCostPerMonth,
  billingInterval,
  supporters,
  goalAmount,
  clubPublicId,
  membershipTierId
}: CampaignHeroProps) {
  const router = useRouter();
  const supportersCount = supporters.length;
  const currentAmount = supportersCount * membershipCostPerMonth;
  const goalCount = Math.ceil(goalAmount / membershipCostPerMonth);
  const progressPercentage = (currentAmount / goalAmount) * 100;

  const handleJoin = () => {
    router.push(`/apply/${clubPublicId}?membershipTierId=${membershipTierId}`);
  };
  // HARDCODED
  const targetDate = new Date("2025-08-20 23:59:59");
  const daysLeft = Math.max(
    Math.ceil((targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
    0
  );

  // Static emojis and colors for the first 5 visible members
  const memberStyles = [
    { emoji: "🧑‍💻", color: "lilac" },
    { emoji: "🎨", color: "beige" },
    { emoji: "🔧", color: "orange" },
    { emoji: "🌟", color: "yellow" },
    { emoji: "💫", color: "green" }
  ];

  // Map actual supporters to founding members with static emojis
  const foundingMembers = supporters.slice(0, 5).map((supporter, index) => ({
    name: supporter.user.firstName,
    emoji: memberStyles[index]?.emoji || "👤",
    color: memberStyles[index]?.color || "gray"
  }));

  const headerBadgeText = useMatches({
    base: "Club launch - Join Founding Crew!",
    md: "New club launch. Join the Founding Crew!"
  });

  return (
    <Box>
      {/* Hero Section */}
      <Box pos="relative">
        <Box
          h={{ base: "40vh", md: "50vh" }}
          style={{
            backgroundImage: `url(https://substackcdn.com/image/fetch/$s_!1xnT!,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F391b4112-0684-42b8-9d26-816403ff7d05_6000x4000.jpeg)`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            position: "relative",
            overflow: "hidden",
            borderRadius: 12
          }}
        >
          <Box
            pos="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            style={{
              background:
                "linear-gradient(to bottom right, rgba(122, 62, 218, 0.8), rgba(255, 200, 87, 0.8), rgba(255, 120, 51, 0.8))"
            }}
          />

          <Container size="lg" h="100%" pos="relative" style={{ zIndex: 10 }}>
            <Center h="100%">
              <Stack align="center" gap="lg">
                <Badge
                  size="lg"
                  radius="xl"
                  color="lilac"
                  leftSection={<IconSparkles size={16} />}
                  style={{
                    backgroundColor: "rgba(122, 62, 218)",
                    animation: "pulse 2s ease-in-out infinite"
                  }}
                >
                  {headerBadgeText}
                </Badge>

                <Title
                  fz={{ base: 32, md: 56, lg: 72 }}
                  fw={700}
                  ta="center"
                  c="white"
                  style={{ lineHeight: 1.2 }}
                >
                  IRL Builders Club
                </Title>

                <Text
                  fz={{ base: 18, md: 20, lg: 24 }}
                  fw={500}
                  ta="center"
                  c="white"
                  style={{ opacity: 0.95, maxWidth: 800, lineHeight: 1.5 }}
                >
                  Calling all IRL builders, dreamers and gatherers in SF. ✨
                  <br />
                  <Text component="span" c={"white"} fw={600}>
                    Let&apos;s make this club come to life!
                  </Text>
                </Text>
              </Stack>
            </Center>
          </Container>
        </Box>

        {/* Floating Info Cards */}
        <Container
          size="lg"
          pos="relative"
          mt={{ base: -48, md: -64 }}
          style={{ zIndex: 20 }}
        >
          <Group justify="center" gap="sm">
            <Card
              p={{ base: 6, md: 8 }}
              px={{ base: 16, md: 20 }}
              radius="xl"
              style={{
                display: "inline-flex",
                width: "auto",
                backgroundColor: "rgba(255, 255, 255, 0.5)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(122, 62, 218, 0.2)",
                boxShadow: "0 8px 25px -5px rgba(122, 62, 218, 0.2)",
                animation: "float 3s ease-in-out infinite"
              }}
            >
              <Group gap="xs">
                <IconMapPin size={16} color="#7A3EDA" />
                <Text fz="sm" fw={500}>
                  SF Commons
                </Text>
              </Group>
            </Card>
            <Card
              p={{ base: 6, md: 8 }}
              px={{ base: 16, md: 20 }}
              radius="xl"
              style={{
                display: "inline-flex",
                width: "auto",
                backgroundColor: "rgba(255, 255, 255, 0.5)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255, 200, 87, 0.2)",
                boxShadow: "0 8px 25px -5px rgba(255, 200, 87, 0.25)",
                animation: "bounce-soft 2s infinite"
              }}
            >
              <Group gap="xs">
                <IconCalendar size={16} color="#FFC857" />
                <Text fz="sm" fw={500}>
                  Last Wed every month
                </Text>
              </Group>
            </Card>
            <Card
              p={{ base: 6, md: 8 }}
              px={{ base: 16, md: 20 }}
              radius="xl"
              style={{
                display: "inline-flex",
                width: "auto",
                backgroundColor: "rgba(255, 255, 255, 0.5)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255, 120, 51, 0.2)",
                boxShadow: "0 8px 25px -5px rgba(122, 62, 218, 0.2)",
                animation: "float 3s ease-in-out infinite"
              }}
            >
              <Group gap="xs">
                <IconUsers size={16} color="#FF7833" />
                <Text fz="sm" fw={500}>
                  {supportersCount} members
                </Text>
              </Group>
            </Card>
          </Group>
        </Container>
      </Box>

      {/* Campaign Progress */}
      <Container size="lg" py={{ base: "xl", md: 64 }}>
        <Card
          shadow="lg"
          radius="md"
          style={{
            background: "rgba(255, 255, 255, 0.3)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1px solid rgba(122, 62, 218, 0.2)",
            overflow: "hidden"
          }}
        >
          <Box p={{ base: "md", md: "xl" }}>
            {/* Progress Numbers */}
            <Stack align="center" mb={{ base: "lg", md: "xl" }}>
              <Grid
                gutter={{ base: "sm", md: "lg" }}
                mb={{ base: "md", md: "lg" }}
                w="100%"
              >
                <Grid.Col span={4}>
                  <Stack align="center" gap={4}>
                    <Title
                      order={1}
                      fz={{ base: 24, md: 36, lg: 48 }}
                      c="lilac"
                    >
                      ${currentAmount}
                    </Title>
                    <Text fz={{ base: 11, md: 14 }} c="dark.3" ta="center">
                      {`pledged of $${goalAmount}/month goal`}
                    </Text>
                  </Stack>
                </Grid.Col>
                <Grid.Col span={4}>
                  <Stack align="center" gap={4}>
                    <Title order={1} fz={{ base: 24, md: 36, lg: 48 }}>
                      {supportersCount}
                    </Title>
                    <Text fz={{ base: 11, md: 14 }} c="dark.3" ta="center">
                      amazing humans supporting
                    </Text>
                  </Stack>
                </Grid.Col>
                <Grid.Col span={4}>
                  <Stack align="center" gap={4}>
                    <Title
                      order={1}
                      fz={{ base: 24, md: 36, lg: 48 }}
                      c="orange"
                    >
                      {daysLeft}
                    </Title>
                    <Text fz={{ base: 11, md: 14 }} c="dark.3" ta="center">
                      days to go
                    </Text>
                  </Stack>
                </Grid.Col>
              </Grid>

              <Stack w="100%" gap="md">
                <Progress
                  value={progressPercentage}
                  size="xl"
                  color="lilac"
                  bg="gray.2"
                />
                <Text ta="center">
                  <Text
                    component="span"
                    fz={{ base: 18, md: 24 }}
                    fw={700}
                    c="lilac"
                    style={{ animation: "bounce-soft 2s infinite" }}
                  >
                    {goalCount - supportersCount > 0
                      ? `${goalCount - supportersCount} amazing
                    humans to go!`
                      : `Goal reached! You can still sign up.`}
                  </Text>
                  <Text
                    component="span"
                    display="block"
                    fz={{ base: 12, md: 14 }}
                    c="dark.3"
                    mt="xs"
                  >
                    {goalCount - supportersCount > 0
                      ? `To reach the $${goalAmount}/month sustainability goal`
                      : "Additional contributions will be used to make the club even better!"}
                  </Text>
                </Text>
              </Stack>
            </Stack>

            {/* Funding Breakdown & Members */}
            <Grid
              gutter={{ base: "lg", md: "xl" }}
              mb={{ base: "lg", md: "xl" }}
            >
              <Grid.Col span={{ base: 12, lg: 6 }}>
                {currentAmount >= goalAmount ? (
                  <Stack gap="md">
                    <Group gap="sm">
                      <Title order={3} fz={17}>
                        Goal met! You can still join us. 🎉
                      </Title>
                    </Group>

                    <Card
                      p="md"
                      radius="md"
                      style={{
                        background: "rgba(122, 62, 218, 0.08)",
                        backdropFilter: "blur(8px)",
                        WebkitBackdropFilter: "blur(8px)",
                        border: "1px solid rgba(122, 62, 218, 0.2)"
                      }}
                    >
                      <Stack align="center" gap="sm">
                        <Text ta="center" fz={20} fw={700} c="lilac">
                          ❤️ Community-supported
                        </Text>
                        <Text ta="center" fz="sm" c="dark.3">
                          Member contributions cover venues, snacks, and all the
                          magic-making essentials. 💛
                        </Text>
                      </Stack>
                    </Card>
                  </Stack>
                ) : (
                  <Stack gap="md">
                    <Group gap="sm">
                      <Title order={3} fz={17}>
                        Club Fuel: Monthly $ Needs 🎯
                      </Title>
                    </Group>

                    <Card
                      p="md"
                      radius="md"
                      style={{
                        background: "rgba(122, 62, 218, 0.08)",
                        backdropFilter: "blur(8px)",
                        WebkitBackdropFilter: "blur(8px)",
                        border: "1px solid rgba(122, 62, 218, 0.2)"
                      }}
                    >
                      <Text ta="center" fz={24} fw={700} c="lilac">
                        ${goalAmount}
                      </Text>
                      <Text ta="center" fz="sm" c="dark.3">
                        total monthly goal
                      </Text>
                    </Card>

                    <Stack gap="sm">
                      <Group
                        justify="space-between"
                        p="sm"
                        style={{
                          background: "rgba(122, 62, 218, 0.08)",
                          backdropFilter: "blur(6px)",
                          WebkitBackdropFilter: "blur(6px)",
                          borderRadius: 12,
                          border: "1px solid rgba(122, 62, 218, 0.15)"
                        }}
                      >
                        <Text fz="sm" fw={500}>
                          Epic venue rental 🏠
                        </Text>
                        <Text fw={700} c="lilac">
                          $300
                        </Text>
                      </Group>
                      <Group
                        justify="space-between"
                        p="sm"
                        style={{
                          background: "rgba(255, 200, 87, 0.08)",
                          backdropFilter: "blur(6px)",
                          WebkitBackdropFilter: "blur(6px)",
                          borderRadius: 12,
                          border: "1px solid rgba(255, 200, 87, 0.15)"
                        }}
                      >
                        <Text fz="sm" fw={500}>
                          Food & snacks 🍕️
                        </Text>
                        <Text fw={700} c="yellow.8">
                          $100
                        </Text>
                      </Group>
                      <Group
                        justify="space-between"
                        p="sm"
                        style={{
                          background: "rgba(255, 120, 51, 0.08)",
                          backdropFilter: "blur(6px)",
                          WebkitBackdropFilter: "blur(6px)",
                          borderRadius: 12,
                          border: "1px solid rgba(255, 120, 51, 0.15)"
                        }}
                      >
                        <Text fz="sm" fw={500}>
                          Hosting, materials & fun 💜
                        </Text>
                        <Text fw={700} c="orange">
                          $40
                        </Text>
                      </Group>
                    </Stack>
                  </Stack>
                )}
              </Grid.Col>

              <Grid.Col span={{ base: 12, lg: 6 }}>
                <Stack gap="md">
                  <Title order={3} fz={17}>
                    Future Founding Crew 👷
                  </Title>

                  <Card
                    p="md"
                    radius="md"
                    style={{
                      background: "rgba(122, 62, 218, 0.08)",
                      backdropFilter: "blur(8px)",
                      WebkitBackdropFilter: "blur(8px)",
                      border: "1px solid rgba(122, 62, 218, 0.2)"
                    }}
                  >
                    <Text ta="center" fz={24} fw={700} c="lilac">
                      {`$${membershipCostPerMonth}/month`}
                    </Text>
                    <Text ta="center" fz="sm" c="dark.3">
                      {billingInterval === BillingInterval.MONTHLY
                        ? "paid monthly"
                        : billingInterval === BillingInterval.QUARTERLY
                          ? "paid quarterly"
                          : "paid semi-annually"}
                    </Text>
                  </Card>

                  <Text size={"sm"}>
                    {`Join this crew of IRL builders, and dreamers! ✨`}
                  </Text>

                  <Grid>
                    {foundingMembers.map((member, index) => (
                      <Grid.Col span={4} key={index}>
                        <Card
                          key={index}
                          p="xs"
                          radius="md"
                          shadow="sm"
                          style={{
                            background: "rgba(255, 255, 255, 0.5)",
                            backdropFilter: "blur(6px)",
                            WebkitBackdropFilter: "blur(6px)",
                            border: "1px solid rgba(122, 62, 218, 0.15)"
                          }}
                        >
                          <Stack gap="xs" h={50} align={"center"}>
                            <Avatar color={member.color} radius="xl" size="sm">
                              {member.emoji}
                            </Avatar>
                            <Text fz="sm" fw={500}>
                              {member.name}
                            </Text>
                          </Stack>
                        </Card>
                      </Grid.Col>
                    ))}
                    {supporters.length > 5 && (
                      <Grid.Col span={4} key={6}>
                        <Card
                          p="xs"
                          radius="md"
                          style={{
                            background: "rgba(128, 128, 128, 0.5)",
                            backdropFilter: "blur(6px)",
                            WebkitBackdropFilter: "blur(6px)",
                            border: "1px solid rgba(128, 128, 128, 0.15)"
                          }}
                        >
                          <Stack gap="xs" h={50} align={"center"}>
                            <Avatar color="gray" radius="xl" size="sm">
                              +{supporters.length - 5}
                            </Avatar>
                            <Text fz="sm" fw={500} c="dark.3">
                              more!
                            </Text>
                          </Stack>
                        </Card>
                      </Grid.Col>
                    )}
                  </Grid>

                  <Text fz={{ base: 12, md: 14 }} c="dark.3">
                    *Amazing humans interested in joining. Final membership
                    subject to mutual fit.
                  </Text>
                </Stack>
              </Grid.Col>
            </Grid>

            {/* CTA */}
            <Stack align="center" gap="md">
              <CTAButton size="xl" icon={IconSparkles} onClick={handleJoin}>
                Join the club
              </CTAButton>
              <Text
                fz={{ base: 12, md: 14 }}
                c="dark.3"
                style={{ textAlign: "center" }}
              >
                💚 All-or-nothing: This club will only be launched if it reaches
                its goal by Wednesday, August 20, 2025 11:59 PM PDT
              </Text>
            </Stack>

            {/* Host Signature */}
            <Card
              mt={{ base: "lg", md: "xl" }}
              p={{ base: "md", md: "lg" }}
              radius="md"
              style={{
                background: "rgba(255, 255, 255, 0.3)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                border: "1px solid rgba(122, 62, 218, 0.2)"
              }}
            >
              <Stack align="center" gap="sm">
                <Text
                  fz={{ base: 18, md: 20 }}
                  fw={600}
                  ta="center"
                  style={{
                    background:
                      "linear-gradient(135deg, #7A3EDA, #FFC857, #FF7833)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent"
                  }}
                >
                  Together, let&apos;s create a place to gather, learn, and
                  belong. ✨
                </Text>
                <Text fw={600} fz={{ base: 18, md: 20 }}>
                  — Saum, Colt, & Mike
                </Text>
                <Text fz={{ base: 12, md: 14 }} c="dark.3">
                  Your soon-to-be founding hosts ✨
                </Text>
              </Stack>
            </Card>
          </Box>
        </Card>
      </Container>

      <style jsx global>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
            box-shadow: 0 0 20px rgba(122, 62, 218, 0.4);
          }
          50% {
            opacity: 0.8;
            box-shadow: 0 0 30px rgba(122, 62, 218, 0.6);
          }
        }

        @keyframes bounce-soft {
          0%,
          100% {
            transform: translateY(0);
            animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
          }
          50% {
            transform: translateY(-5px);
            animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
          }
        }
      `}</style>
    </Box>
  );
}
