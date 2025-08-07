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
  IconHeart,
  IconBulb,
  IconBolt,
  IconHandStop,
  IconMoodSmile
} from "@tabler/icons-react";
import SectionHeader from "./SectionHeader";
import SectionCard from "./SectionCard";
import CTAButton from "./CTAButton";
import EventCard from "./EventCard";
import ExpandableText from "./ExpandableText";
import { Club } from "~/server/club/types";
import { useRouter } from "next/navigation";

interface CampaignStoryProps {
  club: Club;
  membershipTierId: number;
}

export default function CampaignStory({
  club,
  membershipTierId
}: CampaignStoryProps) {
  const router = useRouter();

  const handleJoin = () => {
    router.push(`/apply/${club.publicId}?membershipTierId=${membershipTierId}`);
  };
  const photoGallery = [
    {
      src: "https://images.squarespace-cdn.com/content/v1/65e40100471cd325b28cb39f/4916135d-e91c-41c4-8f1f-a4a1d25f4e84/PXL_20240628_033612718.MP.jpg?format=1500w",
      alt: "BuildIRL Cohort 1"
    },
    {
      src: "https://zepmgttkkbjigvvvbbce.supabase.co/storage/v1/object/public/images/club/77/display/PXL_20250309_015210568.jpg",
      alt: "BuildIRL Fun"
    },
    {
      src: "https://images.squarespace-cdn.com/content/v1/65e40100471cd325b28cb39f/9f50ef2b-02e8-46ec-9834-e18338327dd3/20240608_102853.jpg?format=1500w",
      alt: "BuildIRL Commons"
    },
    {
      src: "https://media.licdn.com/dms/image/v2/D5622AQHEzlugNXNCgQ/feedshare-shrink_2048_1536/B56ZahjCrRGkAw-/0/1746467042433?e=1756339200&v=beta&t=Xpv2A5Gd7xa-6whB86oIhxduKTP248ywIKd-EJxd9B4",
      alt: "BuildIRL Cohort 2"
    }
  ];

  const values = [
    {
      icon: IconBulb,
      title: "Co-create",
      desc: "No spectators — we build this together",
      color: "lilac"
    },
    {
      icon: IconBolt,
      title: "Be Real",
      desc: "Be you. Share wild ideas, fails & wins",
      color: "yellow"
    },
    {
      icon: IconHeart,
      title: "Mutual Respect",
      desc: "Make all feel safe & heard. Above all, be kind️",
      color: "orange"
    },
    {
      icon: IconHandStop,
      title: "Show Up",
      desc: "Be present & lift each other up",
      color: "green"
    },
    {
      icon: IconMoodSmile,
      title: "Choose Fun",
      desc: "Start a game, crack a joke, it's all fair",
      color: "yellow"
    }
  ];

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
                text={`Building a club? Join the club! Running an IRL club is hard. Don’t do it alone.

We’re a tight-knit crew of club builders who support each other at every step — launching and growing clubs, designing for belonging, and co-creating shared resources like IRL spaces, funds, and playbooks.

We’ve hosted 300 person club fairs, expert workshops, epic dinner discussions and more.

If you’re hosting meetups, events, or dreaming of starting something IRL in SF. Join us. Let’s build IRL together and have a blast while we do it 🥳 😝
`}
                wordLimit={50}
              />
            </SectionCard>
          </Grid.Col>

          {/* Right Side - Photo Grid Section */}
          <Grid.Col span={{ base: 12, md: 6 }}>
            <SectionCard decorative={false} style={{ height: "100%" }}>
              <Grid gutter={{ base: "sm", md: "md" }} mb="md">
                {photoGallery.map((photo, index) => (
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
                        window.open(
                          photo.src.replace("w=600", "w=1200"),
                          "_blank"
                        )
                      }
                    >
                      <Image
                        src={photo.src}
                        alt={photo.alt}
                        w="100%"
                        h="100%"
                        fit="cover"
                      />
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
                <ExpandableText
                  text={`Our monthly member hang is a time to connect, share learnings, celebrate wins, and surface opportunities. Think music, bites, great discussion, inspiration, helpful hacks and great humans. 
                 
                  This club is built by members — so you can co-host our meetup, pitch in, bring your ideas or just show up 💛`}
                />
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
                        Every month
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
                        Hosted at SF Commons
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
                  <a href={"https://lu.ma/buildirl?k=c"}>here</a>!
                </Text>
              </Box>

              <EventCard
                title="IRL Builders Club Monthly Gathering"
                description="A monthly hangout for the doers shaping SF’s IRL scene—club leaders, community starters, and creators of all kinds."
                date="August 27"
                time="6-8:00pm"
                image="https://images.lumacdn.com/cdn-cgi/image/format=auto,fit=cover,dpr=2,background=white,quality=75,width=400,height=400/event-covers/9z/f4f4be12-4a25-4e4e-86af-052c065ff230.png"
                imageAlt="BuildIRL"
                link={"https://lu.ma/04ncy3on"}
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
                All the good stuff that comes with being a founding member ✨
              </Text>
            </Box>

            {/* Benefits Grid */}
            <Grid gutter="lg">
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Stack gap="sm">
                  <Group gap="sm" align="flex-start">
                    <Text c="lilac" fw={600}>
                      ✓
                    </Text>
                    <Text fz="sm">Monthly meetups 🎉, food & vibes 🍕</Text>
                  </Group>
                  <Group gap="sm" align="flex-start">
                    <Text c="lilac" fw={600}>
                      ✓
                    </Text>
                    <Text fz="sm">Build cool stuff with amazing humans</Text>
                  </Group>
                  <Group gap="sm" align="flex-start">
                    <Text c="lilac" fw={600}>
                      ✓
                    </Text>
                    <Text fz="sm">Member WhatsApp group & directory</Text>
                  </Group>
                </Stack>
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Stack gap="sm">
                  <Group gap="sm" align="flex-start">
                    <Text c="lilac" fw={600}>
                      ✓
                    </Text>
                    <Text fz="sm">Playbooks, tools & best practices</Text>
                  </Group>
                  <Group gap="sm" align="flex-start">
                    <Text c="lilac" fw={600}>
                      ✓
                    </Text>
                    <Text fz="sm">Venue hookups & sponsor deals</Text>
                  </Group>
                  <Group gap="sm" align="flex-start">
                    <Text c="lilac" fw={600}>
                      ✓
                    </Text>
                    <Text fz="sm">
                      Co-create. Co-host. Bring your ideas. 💡
                    </Text>
                  </Group>
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
                {values.map((value, index) => (
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
                        {value.title}
                      </Title>
                      <Text fz="xs" c="dark.3">
                        {value.desc}
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
