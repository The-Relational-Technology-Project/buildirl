"use client";

import { useState, useMemo } from "react";
import { Stack, Title, Text, Button, SimpleGrid, Divider, Box, BackgroundImage } from "@mantine/core";
import { api } from "~/trpc/react";
import DiscoverCard from "~/app/(main)/_components/DiscoverCard";
import ClubSearchBar from "~/app/(main)/_components/ClubSearchBar";
import PrimaryButton from "~/client/components/PrimaryButton";
import { useRouter } from "next/navigation";
import { QueryError } from "~/client/utils/QueryError";
import { isLoaded } from "~/client/utils";
import { WelcomeImage } from "~/client/components/Images";
import { useMatches } from "@mantine/core";

function EmptyState() {
  const imageSize = useMatches({ base: 200, md: 300 });
  const router = useRouter();

  return (
    <Stack justify="center" align="center" gap="md" mih="60vh">
      <WelcomeImage size={imageSize} />
      <Title order={3} style={{ textAlign: "center" }}>
        No clubs available yet
      </Title>
      <Text size="md" c="dimmed" style={{ textAlign: "center" }}>
        Check back soon for new clubs to discover!
      </Text>
      <Button size="lg" onClick={() => router.push("/login")}>
        Sign Up to Get Notified
      </Button>
    </Stack>
  );
}

export default function PublicDiscoverPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const allClubs = api.main.allClubs.useQuery();

  QueryError.check({
    result: allClubs,
    fieldName: "allClubs"
  });

  const filteredClubs = useMemo(() => {
    let clubs = allClubs.data || [];

    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      clubs = clubs.filter(club =>
        club.name.toLowerCase().includes(searchLower) ||
        club.tagLine.toLowerCase().includes(searchLower)
      );
    }

    if (selectedLocation) {
      clubs = clubs.filter(club => club.location === selectedLocation);
    }

    return clubs.sort((c1, c2) => c2.id - c1.id);
  }, [allClubs.data, searchTerm, selectedLocation]);

  if (!isLoaded(allClubs)) {
    return null;
  }

  if (allClubs.data!.length === 0) {
    return <EmptyState />;
  }

  return (
    <Stack gap="xl" mb="xl">
      <BackgroundImage
        src="/images/commons-550-studio-event-speakers-chatting.jpeg"
        style={{
          minHeight: 500,
          width: "100vw",
          marginLeft: "calc(-50vw + 50%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        <Box
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            borderRadius: 8,
            padding: "40px 60px",
            textAlign: "center"
          }}
        >
          <Stack align="center" gap="md">
            <Title order={1} c="white" style={{ textAlign: "center" }}>
              Discover Local Clubs
            </Title>
            <Text size="lg" c="white" style={{ textAlign: "center" }}>
              Find your people, build meaningful connections
            </Text>
            <Box
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.9)",
                padding: "12px 24px",
                borderRadius: 8,
                border: "1px solid rgba(255, 255, 255, 0.2)"
              }}
            >
              <Text
                size="xl"
                c="dark"
                fw={600}
                style={{
                  textAlign: "center",
                  cursor: "default"
                }}
              >
                Explore clubs below{" "}
                <span
                  style={{
                    display: "inline-block",
                    animation: "bounce-soft 1s infinite"
                  }}
                >
                  👇
                </span>
              </Text>
            </Box>
          </Stack>
        </Box>
      </BackgroundImage>

      <Box px={{ base: 30, md: 0 }}>
        <Divider />

        <Stack gap="md" align="center" py="lg">
        <ClubSearchBar
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          selectedLocation={selectedLocation}
          onLocationChange={setSelectedLocation}
        />

        {(searchTerm || selectedLocation) && (
          <Text size="sm" c="dimmed" fw={500}>
            {filteredClubs.length} club{filteredClubs.length === 1 ? '' : 's'} found
          </Text>
        )}
        </Stack>

        {filteredClubs.length === 0 && (searchTerm || selectedLocation) ? (
          <Stack align="center" gap="md" py="xl">
            <Title order={3} style={{ textAlign: "center" }}>
              No clubs found
            </Title>
            <Text size="md" c="dimmed" style={{ textAlign: "center" }}>
              Try adjusting your {searchTerm && selectedLocation ? "search or location" : searchTerm ? "search terms" : "location filter"}
            </Text>
          </Stack>
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
            {filteredClubs.map((club) => (
              <DiscoverCard key={club.id} club={club} />
            ))}
          </SimpleGrid>
        )}

        <Stack align="center" gap="md" mt="xl" py="xl">
          <PrimaryButton
            onClick={() => window.open("https://www.buildirl.com", "_blank")}
            size="lg"
            w={{ base: 300, md: 400 }}
          >
Don't see what you want? Build one!
          </PrimaryButton>
        </Stack>
      </Box>

      <style jsx global>{`
        @keyframes bounce-soft {
          0%,
          100% {
            transform: translateY(0);
            animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
          }
          50% {
            transform: translateY(-12px);
            animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
          }
        }
      `}</style>
    </Stack>
  );
}
