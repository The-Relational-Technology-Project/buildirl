"use client";

import { useState, useMemo } from "react";
import { Stack, Title, Text, Button, SimpleGrid, TextInput, Divider, Box, Group, Select } from "@mantine/core";
import { IconSearch, IconSparkles } from "@tabler/icons-react";
import { api } from "~/trpc/react";
import DiscoverCard from "~/app/(main)/_components/DiscoverCard";
import PrimaryButton from "~/client/components/PrimaryButton";
import { useRouter } from "next/navigation";
import { QueryError } from "~/client/utils/QueryError";
import { isLoaded } from "~/client/utils";
import { WelcomeImage } from "~/client/components/Images";
import { useMatches } from "@mantine/core";
import { CITIES } from "~/server/club/types/location";

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
    <Stack gap="xl" my="xl">
      <Stack align="center" gap="md" py="xl">
        <Title order={1} style={{ textAlign: "center" }}>
          Discover Local Clubs
        </Title>
        <Text size="lg" c="dimmed" style={{ textAlign: "center" }}>
          Find your people, build meaningful connections
        </Text>
        <PrimaryButton onClick={() => router.push("/login")}>
          Sign Up to Join
        </PrimaryButton>
      </Stack>

      <Divider />

      <Stack gap="md" align="center" py="lg">
        <Box
          w={{ base: "100%", sm: 600, md: 800 }}
          style={{
            border: "1px solid #e9ecef",
            borderRadius: 30,
            backgroundColor: "#ffffff",
            display: "flex",
            alignItems: "center",
            padding: "8px 16px",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)"
          }}
        >
          <Box style={{ flex: 2, display: "flex", alignItems: "center" }}>
            <IconSearch size={18} color="#868e96" style={{ marginRight: 12 }} />
            <TextInput
              placeholder="Search clubs by name or description..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.currentTarget.value)}
              size="lg"
              styles={{
                input: {
                  border: "none",
                  backgroundColor: "transparent",
                  padding: 0,
                  fontSize: "16px"
                }
              }}
            />
          </Box>

          <Divider
            orientation="vertical"
            style={{
              height: 40,
              margin: "0 16px",
              borderColor: "#dee2e6"
            }}
          />

          <Box style={{ flex: 1 }}>
            <Select
              placeholder="Filter by location"
              data={CITIES}
              value={selectedLocation}
              onChange={setSelectedLocation}
              searchable
              clearable
              size="lg"
              styles={{
                input: {
                  border: "none",
                  backgroundColor: "transparent",
                  padding: 0,
                  fontSize: "16px"
                }
              }}
            />
          </Box>
        </Box>

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

      <Box
        p="xl"
        style={{
          backgroundColor: "#f2eeff",
          border: "2px solid black",
          borderRadius: 8,
          boxShadow: "4px 4px 0px black",
          maxWidth: 400,
          margin: "0 auto"
        }}
      >
        <Stack align="center" gap="md">
          <Group gap="xs" justify="center">
            <IconSparkles size={20} color="#7a63cb" />
            <Text size="lg" fw={600} c="#563da3" style={{ textAlign: "center" }}>
              Start Your Own Club Here
            </Text>
            <IconSparkles size={20} color="#7a63cb" />
          </Group>
          <PrimaryButton
            onClick={() => window.open("https://www.buildirl.com", "_blank")}
            size="lg"
            w={{ base: 200, md: 250 }}
          >
            Build a club
          </PrimaryButton>
        </Stack>
      </Box>
    </Stack>
  );
}
