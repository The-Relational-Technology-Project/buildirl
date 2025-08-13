// !! PROTOTYPE

"use client";

import { Card, Group, Text, Image, Stack, Box } from "@mantine/core";

interface EventCardProps {
  title: string;
  description: string;
  date: string;
  time: string;
  image: string;
  imageAlt: string;
  link: string;
}

export default function EventCard({
  title,
  description,
  date,
  time,
  image,
  imageAlt,
  link
}: EventCardProps) {
  return (
    <Card
      p={{ base: "md", md: "lg" }}
      style={{
        textAlign: "center",
        background: "rgba(255, 255, 255, 0.5)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        border: "1px solid rgba(64, 175, 105, 0.2)",
        boxShadow: "0 8px 25px -5px rgba(255, 200, 87, 0.15)"
      }}
    >
      <Group justify="center" gap="sm" mb="md">
        <Text fw={600} fz={{ base: 16, md: 18 }} c="#40AF69">
          Upcoming event ✨
        </Text>
      </Group>

      <Card
        p={{ base: "sm", md: "md" }}
        mb={{ base: "sm", md: "md" }}
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.5)",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(64, 175, 105, 0.2)",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
          transition: "all 0.2s ease",
          cursor: "pointer"
        }}
        onClick={() => window.open(link)}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.05)";
          e.currentTarget.style.boxShadow =
            "0 8px 30px rgba(64, 175, 105, 0.2)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.1)";
        }}
      >
        <Stack>
          <Group gap="md" align="center">
            <Box
              w={{ base: 48, md: 64 }}
              h={{ base: 48, md: 64 }}
              style={{ borderRadius: 12, overflow: "hidden", flexShrink: 0 }}
            >
              <Image src={image} alt={imageAlt} w="100%" h="100%" fit="cover" />
            </Box>
            <Stack gap={0} style={{ flex: 1, textAlign: "left" }}>
              <Text fw={500} fz={{ base: 14, md: 16 }}>
                {title}
              </Text>
              <Text fz={{ base: 12, md: 14 }} c="dark.3">
                {description}
              </Text>
            </Stack>
          </Group>
          <Stack gap={0} align="flex-end">
            <Text fw={700} fz={{ base: 14, md: 16 }} c="#40AF69">
              {date}
            </Text>
            <Text fz={{ base: 12, md: 14 }} c="dark.3">
              {time}
            </Text>
          </Stack>
        </Stack>
      </Card>

      <style jsx>{`
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
      `}</style>
    </Card>
  );
}
