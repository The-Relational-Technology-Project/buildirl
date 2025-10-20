import { Select, SelectProps, Stack, Text } from "@mantine/core";
import React from "react";
import { CITIES } from "~/server/club/types/location";

type LocationSelectProps = {
  error: React.ReactNode;
};

export default function LocationSelect({
  value,
  onChange,
  error,
  styles
}: LocationSelectProps & SelectProps) {
  return (
    <Stack gap={0}>
      <Select
        data={CITIES}
        searchable
        clearable
        placeholder="Select or search for a location"
        value={value}
        onChange={onChange}
        styles={styles}
      />
      {error && (
        <Text c="red" size="xs" mt={5}>
          {error}
        </Text>
      )}
    </Stack>
  );
}
