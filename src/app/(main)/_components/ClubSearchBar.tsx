"use client";

import { Box, TextInput, Select, Divider } from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";
import { CITIES } from "~/server/club/types/location";

interface ClubSearchBarProps {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  selectedLocation: string | null;
  onLocationChange: (value: string | null) => void;
}

export default function ClubSearchBar({
  searchTerm,
  onSearchTermChange,
  selectedLocation,
  onLocationChange,
}: ClubSearchBarProps) {
  return (
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
          onChange={(event) => onSearchTermChange(event.currentTarget.value)}
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
          onChange={onLocationChange}
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
  );
}
