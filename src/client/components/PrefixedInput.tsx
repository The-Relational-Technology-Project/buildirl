import React from "react";
import {
  Group,
  Text,
  TextInput,
  TextInputProps,
  useMantineTheme,
  useMantineColorScheme,
  Box
} from "@mantine/core";

/**
 * A reusable input component with a prefix label (like instagram.com/)
 */
type PrefixedInputProps = {
  prefix: string;
};

export default function PrefixedInput({
  prefix,
  error,
  ...props
}: PrefixedInputProps & TextInputProps) {
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";

  const borderColor = isDark
    ? theme.other.dark.borderStrong
    : theme.other.dark.ink;
  const bgColor = isDark ? theme.other.dark.surfaceAlt : theme.colors.gray[0];

  return (
    <Box>
      <Group gap={0} wrap="nowrap">
        <Text
          size="sm"
          style={{
            background: bgColor,
            padding: "8px 8px",
            borderRadius: "4px 0 0 4px",
            border: `1px solid ${borderColor}`,
            borderRight: "none"
          }}
        >
          {prefix}
        </Text>
        <TextInput
          w="100%"
          styles={{
            input: {
              borderTopLeftRadius: 0,
              borderBottomLeftRadius: 0,
              border: `1px solid ${borderColor}`
            },
            error: {
              marginTop: "5px"
            }
          }}
          // use the error message instead as this error message will
          // mess up the layout
          error={null}
          {...props}
        />
      </Group>
      {error && (
        <Text c="red" size="xs" mt={5}>
          {error}
        </Text>
      )}
    </Box>
  );
}
