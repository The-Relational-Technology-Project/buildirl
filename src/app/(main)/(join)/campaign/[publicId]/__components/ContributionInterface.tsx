// !! PROTOTYPE

"use client";

import {
  Container,
  Card,
  Stack,
  Title,
  Text,
  Grid,
  Group,
  Box,
  Divider,
  Badge,
  Center
} from "@mantine/core";
import { IconSparkles, IconHeart } from "@tabler/icons-react";
import CTAButton from "./CTAButton";
import { Club } from "~/server/club/types";
import { useRouter } from "next/navigation";

interface ContributionInterfaceProps {
  club: Club;
  membershipTierId: number;
  goalAmountDisplay: number;
}

export default function ContributionInterface({
  club,
  membershipTierId,
  goalAmountDisplay
}: ContributionInterfaceProps) {
  const router = useRouter();

  const handleContribute = () => {
    router.push(`/apply/${club.publicId}?membershipTierId=${membershipTierId}`);
  };

  return (
    <Container size="lg" py={64} pos="relative">
      {/* Background decorations */}
      <Box
        pos="absolute"
        top={40}
        left={40}
        w={64}
        h={64}
        style={{
          backgroundColor: "rgba(122, 62, 218, 0.1)",
          borderRadius: "50%",
          animation: "float 3s ease-in-out infinite"
        }}
      />
      <Box
        pos="absolute"
        top={128}
        right={80}
        w={48}
        h={48}
        style={{
          backgroundColor: "rgba(255, 200, 87, 0.1)",
          borderRadius: "50%",
          animation: "bounce-soft 2s infinite"
        }}
      />
      <Box
        pos="absolute"
        bottom={80}
        left={80}
        w={80}
        h={80}
        style={{
          backgroundColor: "rgba(255, 120, 51, 0.1)",
          borderRadius: "50%",
          animation: "float 3s ease-in-out infinite"
        }}
      />

      <Stack gap="xl" pos="relative" style={{ zIndex: 10 }}>
        {/* Campaign Mechanics */}
        <Card
          p={{ base: "lg", md: "xl" }}
          style={{
            background: "rgba(255, 255, 255, 0.3)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            border: "1px solid rgba(64, 175, 105, 0.2)",
            boxShadow: "0 8px 25px -5px rgba(255, 200, 87, 0.15)"
          }}
        >
          <Stack align="center">
            <Group gap="sm" mb="lg">
              <Title
                order={3}
                fz={{ base: 20, md: 24 }}
                style={{ textAlign: "center" }}
              >
                How our campaign works
              </Title>
            </Group>

            <Grid gutter={{ base: "xl", md: 48 }} w="100%">
              <Grid.Col span={{ base: 12, md: 4 }}>
                <Stack align="center" gap="sm">
                  <Center
                    w={48}
                    h={48}
                    style={{
                      backgroundColor: "rgba(64, 175, 105, 0.2)",
                      borderRadius: "50%",
                      color: "#40AF69",
                      fontWeight: 700,
                      fontSize: 18
                    }}
                  >
                    1
                  </Center>
                  <Stack gap={8} align="center">
                    <Text fw={600} fz="sm">
                      All-or-Nothing Magic 💚
                    </Text>
                    <Text fz="sm" c="dark.3" ta="center">
                      You&apos;re only charged if we reach our full monthly goal
                      by the deadline
                    </Text>
                  </Stack>
                </Stack>
              </Grid.Col>

              <Grid.Col span={{ base: 12, md: 4 }}>
                <Stack align="center" gap="sm">
                  <Center
                    w={48}
                    h={48}
                    style={{
                      backgroundColor: "rgba(122, 62, 218, 0.2)",
                      borderRadius: "50%",
                      color: "#7A3EDA",
                      fontWeight: 700,
                      fontSize: 18
                    }}
                  >
                    2
                  </Center>
                  <Stack gap={8} align="center" mx={-2}>
                    <Text fw={600} fz="sm">
                      Monthly Community Power ⚡
                    </Text>
                    <Text fz="sm" c="dark.3" ta="center">
                      If successful, your contribution keeps our magic alive
                      every month
                    </Text>
                  </Stack>
                </Stack>
              </Grid.Col>

              <Grid.Col span={{ base: 12, md: 4 }}>
                <Stack align="center" gap="sm">
                  <Center
                    w={48}
                    h={48}
                    style={{
                      backgroundColor: "rgba(255, 120, 51, 0.2)",
                      borderRadius: "50%",
                      color: "#FF7833",
                      fontWeight: 700,
                      fontSize: 18
                    }}
                  >
                    3
                  </Center>
                  <Stack gap={8} align="center">
                    <Text fw={600} fz="sm">
                      Flexible ✨
                    </Text>
                    <Text fz="sm" c="dark.3" ta="center">
                      Change or cancel membership anytime. Only your first
                      contribution is committed at launch.
                    </Text>
                  </Stack>
                </Stack>
              </Grid.Col>
            </Grid>
          </Stack>
        </Card>

        <Divider
          style={{
            background:
              "linear-gradient(to right, transparent, rgba(0, 0, 0, 0.1), transparent)"
          }}
        />

        {/* CTA Section */}
        <Center>
          <Card
            p={{ base: "lg", md: "xl" }}
            style={{
              background: "rgba(255, 255, 255, 0.3)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: "1px solid rgba(122, 62, 218, 0.2)",
              boxShadow: "0 8px 25px -5px rgba(122, 62, 218, 0.15)",
              position: "relative",
              overflow: "hidden",
              maxWidth: 800,
              width: "100%"
            }}
          >
            <Box
              pos="absolute"
              top={0}
              right={0}
              w={96}
              h={96}
              style={{
                backgroundColor: "rgba(255, 200, 87, 0.1)",
                borderRadius: "50%",
                transform: "translate(48px, -48px)"
              }}
            />
            <Box
              pos="absolute"
              bottom={0}
              left={0}
              w={80}
              h={80}
              style={{
                backgroundColor: "rgba(255, 120, 51, 0.1)",
                borderRadius: "50%",
                transform: "translate(-40px, 40px)"
              }}
            />

            <Stack
              align="center"
              gap="lg"
              pos="relative"
              style={{ zIndex: 10 }}
            >
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
                Join the founding crew
              </Badge>

              <Title
                order={2}
                fz={{ base: 28, md: 32 }}
                ta="center"
                style={{
                  background:
                    "linear-gradient(135deg, #7A3EDA, #FFC857, #FF7833)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent"
                }}
              >
                Time to Build IRL: make this club real!
              </Title>

              <Stack align="center" gap="lg">
                <Text fz={{ base: 16, md: 18 }} c="dark.3" ta="center" fw={500}>
                  Become a founding member! You&apos;re not just funding —
                  you&apos;re{" "}
                  <Text component="span" fw={700} c="lilac">
                    co-creating
                  </Text>{" "}
                  our shared future.
                </Text>

                <Card
                  p="lg"
                  radius="md"
                  style={{
                    background: "rgba(122, 62, 218, 0.08)",
                    backdropFilter: "blur(8px)",
                    WebkitBackdropFilter: "blur(8px)",
                    border: "1px solid rgba(122, 62, 218, 0.2)"
                  }}
                >
                  <Stack align="center" gap="xs">
                    <Text fz="sm" c="dark.3">
                      Monthly Goal
                    </Text>
                    <Title
                      order={1}
                      fz={{ base: 42, md: 48 }}
                      style={{
                        background:
                          "linear-gradient(135deg, #7A3EDA, #FFC857, #FF7833)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent"
                      }}
                    >
                      ${goalAmountDisplay}
                    </Title>
                    <Text fz="sm" c="dark.3">
                      to keep our magic alive
                    </Text>
                    <Group gap="xs" mt="xs">
                      <Text fz="xs" c="dark.3">
                        Sustainable & community-supported
                      </Text>
                      <IconHeart size={12} color="#FFC857" />
                    </Group>
                  </Stack>
                </Card>

                <Group gap="xs" c="green">
                  <Text fz="sm" style={{ textAlign: "center" }}>
                    Ready to be part of something special? ✨
                  </Text>
                </Group>
              </Stack>

              <CTAButton
                size="xl"
                icon={IconSparkles}
                onClick={handleContribute}
              >
                Join the crew
              </CTAButton>

              <Text
                fz={{ base: 12, md: 14 }}
                c="dark.3"
                ta="center"
                maw={600}
                style={{ lineHeight: 1.6 }}
              >
                By backing this project, you&apos;re joining our founding crew!
                Remember: you&apos;re only charged if we hit our goal by the
                deadline. 💚
              </Text>
            </Stack>
          </Card>
        </Center>
      </Stack>
    </Container>
  );
}
