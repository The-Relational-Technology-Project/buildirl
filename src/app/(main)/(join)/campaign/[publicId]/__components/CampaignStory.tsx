// !! PROTOTYPE

"use client";

import {
  Container,
  Stack,
  Grid,
  Title,
  Text,
  Group,
  Image,
  Box,
  Card,
  ThemeIcon
} from "@mantine/core";
import {
  IconUsers,
  IconCalendar,
  IconCoffee,
  IconHeart
} from "@tabler/icons-react";
import SectionHeader from "./SectionHeader";
import SectionCard from "./SectionCard";
import CTAButton from "./CTAButton";
import EventCard from "./EventCard";
import ExpandableText from "./ExpandableText";
import { Club } from "~/server/club/types";
import { useRouter } from "next/navigation";
import { CampaignConfiguration } from "~/app/(main)/(join)/campaign/[publicId]/config";

interface CampaignStoryProps {
  club: Club;
  membershipTierId: number;
  campaignConfiguration: CampaignConfiguration;
}

export default function CampaignStory({
  club,
  membershipTierId,
  campaignConfiguration
}: CampaignStoryProps) {
  const router = useRouter();

  const handleJoin = () => {
    router.push(`/apply/${club.publicId}?membershipTierId=${membershipTierId}`);
  };

  const whyJoinUs = campaignConfiguration.whyJoinUs;
  const midIndex = Math.ceil(whyJoinUs.length / 2);
  const leftWhyJoinUs = whyJoinUs.slice(0, midIndex);
  const rightWhyJoinUs = whyJoinUs.slice(midIndex);

  return (
    <Container size="lg" py={{ base: 16, md: 32 }}>
      <Stack gap="xl">
        {/* Who We Are and Photo Grid */}
        <Grid gutter={{ base: "lg", md: "xl" }} align="stretch">
          {/* Left Side - Who We Are Section */}
          <Grid.Col span={{ base: 12, md: 6 }}>
            <SectionCard style={{ height: "100%" }}>
              <SectionHeader
                title="Who we are"
                icon={IconUsers}
                badge="Our people, our vibes, our world ✨"
                badgeColor="lilac"
              />

              <ExpandableText
                text={campaignConfiguration.whoWeAre}
                wordLimit={50}
              />
            </SectionCard>
          </Grid.Col>

          {/* Right Side - Photo Grid Section */}
          <Grid.Col span={{ base: 12, md: 6 }}>
            <SectionCard decorative={false} style={{ height: "100%" }}>
              <Grid gutter={{ base: "sm", md: "md" }} mb="md">
                {campaignConfiguration.pictureUrls.map((photo, index) => (
                  <Grid.Col span={6} key={index}>
                    <Box
                      style={{
                        aspectRatio: "1/1",
                        borderRadius: 16,
                        overflow: "hidden",
                        cursor: "pointer",
                        transition: "all 0.3s ease",
                        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "scale(1.05)";
                        e.currentTarget.style.boxShadow =
                          "0 8px 30px rgba(0, 0, 0, 0.15)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "scale(1)";
                        e.currentTarget.style.boxShadow =
                          "0 4px 20px rgba(0, 0, 0, 0.1)";
                      }}
                      onClick={() =>
                        window.open(photo.replace("w=600", "w=1200"), "_blank")
                      }
                    >
                      <Image src={photo} w="100%" h="100%" fit="cover" />
                    </Box>
                  </Grid.Col>
                ))}
              </Grid>
            </SectionCard>
          </Grid.Col>
        </Grid>

        {/* How We Hang - Split Screen */}
        <Grid gutter={{ base: "lg", md: "xl" }} align="stretch">
          {/* Left Side - How We Hang Info */}
          <Grid.Col span={{ base: 12, md: 6 }}>
            <SectionCard style={{ height: "100%" }}>
              <SectionHeader
                title="How we hang"
                icon={IconCalendar}
                badge="Regular Meetups, Member Magic ✨"
                badgeColor="yellow"
                iconColor="yellow"
              />

              <Box mb={{ base: "lg", md: "xl" }}>
                <ExpandableText text={campaignConfiguration.howWeHang} />
              </Box>

              <Grid gutter={{ base: "md", md: "lg" }}>
                <Grid.Col span={{ base: 12, sm: 12 }}>
                  <Card
                    p={{ base: "sm", md: "md" }}
                    style={{
                      background: "rgba(255, 255, 255, 0.5)",
                      backdropFilter: "blur(8px)",
                      WebkitBackdropFilter: "blur(8px)",
                      border: "1px solid rgba(122, 62, 218, 0.2)"
                    }}
                  >
                    <Group gap="sm">
                      <Box
                        p={{ base: "xs", md: "sm" }}
                        style={{
                          backgroundColor: "rgba(122, 62, 218, 0.2)",
                          borderRadius: 12
                        }}
                      >
                        <IconCalendar size={18} color="#7A3EDA" />
                      </Box>
                      <Title order={6} fz={{ base: 12, md: 14 }}>
                        {campaignConfiguration.frequency}
                      </Title>
                    </Group>
                  </Card>
                </Grid.Col>

                <Grid.Col span={{ base: 12, sm: 12 }}>
                  <Card
                    p={{ base: "sm", md: "md" }}
                    style={{
                      background: "rgba(255, 255, 255, 0.5)",
                      backdropFilter: "blur(8px)",
                      WebkitBackdropFilter: "blur(8px)",
                      border: "1px solid rgba(255, 200, 87, 0.2)"
                    }}
                  >
                    <Group gap="sm">
                      <Box
                        p={{ base: "xs", md: "sm" }}
                        style={{
                          backgroundColor: "rgba(255, 200, 87, 0.2)",
                          borderRadius: 12
                        }}
                      >
                        <IconCoffee size={18} color="#FFC857" />
                      </Box>
                      <Title order={6} fz={{ base: 12, md: 14 }}>
                        {campaignConfiguration.location}
                      </Title>
                    </Group>
                  </Card>
                </Grid.Col>
              </Grid>
            </SectionCard>
          </Grid.Col>

          {/* Right Side - Upcoming Events */}
          <Grid.Col span={{ base: 12, md: 6 }}>
            <SectionCard style={{ height: "100%" }}>
              <Box mb={{ base: "md", md: "lg" }}>
                <Title order={3} fz={{ base: 18, md: 20 }} mb="xs">
                  Upcoming Events
                </Title>
                <Text fz="sm" c="dark.3">
                  Join us for our next gathering. See our full event calendar{" "}
                  <a href={campaignConfiguration.calendarLink}>here</a>!
                </Text>
              </Box>

              <EventCard
                title={campaignConfiguration.calendarEvent.title}
                description={campaignConfiguration.calendarEvent.description}
                date={campaignConfiguration.calendarEvent.date}
                time={campaignConfiguration.calendarEvent.time}
                image={campaignConfiguration.calendarEvent.imageUrl}
                imageAlt="event image"
                link={campaignConfiguration.calendarEvent.eventLink}
              />
            </SectionCard>
          </Grid.Col>
        </Grid>

        {/* Why Join Us - Full Width */}
        <SectionCard>
          <Stack gap="lg">
            {/* Header */}
            <Box>
              <Group gap="sm" mb="sm">
                <ThemeIcon>
                  <IconHeart size={18} color="#7A3EDA" />
                </ThemeIcon>
                <Title order={2} fz={{ base: 18, md: 20 }}>
                  Why join us
                </Title>
              </Group>
              <Text fz="sm" c="dark.3" mb="lg">
                All the valuable opportunities that comes with being a Founding
                Member ✨
              </Text>
            </Box>

            {/* Benefits Grid */}
            <Grid gutter="lg">
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Stack gap="sm">
                  {leftWhyJoinUs.map((i, index) => {
                    return (
                      <Group gap="sm" align="flex-start" key={index}>
                        <Text fz={{ base: "xs", md: "sm" }} c="lilac" fw={600}>
                          ✓
                        </Text>
                        <Text fz={{ base: "xs", md: "sm" }}>{i}</Text>
                      </Group>
                    );
                  })}
                </Stack>
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Stack gap="sm">
                  {rightWhyJoinUs.map((i, index) => {
                    return (
                      <Group gap="sm" align="flex-start" key={index}>
                        <Text fz={{ base: "xs", md: "sm" }} c="lilac" fw={600}>
                          ✓
                        </Text>
                        <Text fz={{ base: "xs", md: "sm" }}>{i}</Text>
                      </Group>
                    );
                  })}
                </Stack>
              </Grid.Col>
            </Grid>

            {/* CTA */}
            <Box mt="md">
              <Stack justify="space-between" align="center" gap="md">
                <Text
                  fz="md"
                  fw={500}
                  c="dark.5"
                  style={{ textAlign: "center" }}
                >
                  Ready to be part of something special?
                </Text>
                <Box style={{ alignSelf: "center" }}>
                  <CTAButton icon={IconHeart} onClick={handleJoin}>
                    Join the club
                  </CTAButton>
                </Box>
              </Stack>
            </Box>
          </Stack>
        </SectionCard>

        {/* Our Vibe Check */}
        <SectionCard>
          <Grid gutter={{ base: "lg", md: "xl" }} mb="lg">
            {/* Left side - Header */}
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Title order={2} fz={{ base: 20, md: 24 }} mb="xs">
                Our vibe check ✨
              </Title>
              <Text fz="sm" c="dark.3">
                The values that make our community special
              </Text>
            </Grid.Col>

            {/* Right side - Values Grid */}
            <Grid.Col span={{ base: 12, md: 8 }}>
              <Grid gutter={{ base: "sm", md: "md" }}>
                {campaignConfiguration.values.map((value, index) => (
                  <Grid.Col span={{ base: 12, sm: 6, lg: 4 }} key={index}>
                    <Card
                      ta="center"
                      p="sm"
                      radius="md"
                      h="100%"
                      style={{
                        background: "rgba(255, 255, 255, 0.5)",
                        backdropFilter: "blur(8px)",
                        WebkitBackdropFilter: "blur(8px)",
                        border: "1px solid rgba(122, 62, 218, 0.2)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      <Box
                        w={40}
                        h={40}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          margin: "0 auto 8px",
                          backgroundColor: "rgba(122, 62, 218, 0.1)",
                          borderRadius: "50%",
                          flexShrink: 0
                        }}
                      >
                        <value.icon
                          size={22}
                          color="#7A3EDA"
                          style={{ flexShrink: 0 }}
                        />
                      </Box>
                      <Title order={6} fz="sm" mb={4}>
                        {value.heading}
                      </Title>
                      <Text fz="xs" c="dark.3">
                        {value.description}
                      </Text>
                    </Card>
                  </Grid.Col>
                ))}
              </Grid>
            </Grid.Col>
          </Grid>

          {/* CTA Section Below */}
          <Card
            ta="center"
            p="md"
            radius="md"
            pos="relative"
            style={{
              background: "rgba(255, 255, 255, 0.5)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              border: "2px solid rgba(122, 62, 218, 0.3)",
              overflow: "hidden"
            }}
          >
            <Box
              pos="absolute"
              top={0}
              right={0}
              w={48}
              h={48}
              style={{
                backgroundColor: "rgba(255, 200, 87, 0.2)",
                borderRadius: "50%",
                transform: "translate(24px, -24px)",
                animation: "float 3s ease-in-out infinite"
              }}
            />
            <Box pos="relative" style={{ zIndex: 10 }}>
              <Text
                fw={700}
                fz={16}
                mb="xs"
                style={{
                  background: "#7A3EDA",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent"
                }}
              >
                Sound like your people? ✨
              </Text>
              <Text fz="xs" c="dark.2" mb="md" style={{ lineHeight: 1.6 }}>
                Join builders who believe in real connection & shared creation.
              </Text>
              <CTAButton icon={IconHeart} onClick={handleJoin}>
                Back this club
              </CTAButton>
            </Box>
          </Card>
        </SectionCard>
      </Stack>
    </Container>
  );
}
