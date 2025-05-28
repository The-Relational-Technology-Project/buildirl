import { Select, SelectProps, Stack, Text } from "@mantine/core";
import React from "react";
import { CITIES } from "~/server/membership/types/location";

type LocationSelectProps = {
  error: React.ReactNode;
};

export default function LocationSelect({
  value,
  onChange,
  error
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
      />
      {error && (
        <Text c="red" size="xs" mt={5}>
          {error}
        </Text>
      )}
    </Stack>
  );
}
