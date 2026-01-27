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
  styles,
  ...props
}: PrefixedInputProps & TextInputProps) {
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";

  const borderColor = isDark
    ? theme.other.dark.borderStrong
    : theme.other.dark.ink;
  const bgColor = isDark ? theme.other.dark.surfaceAlt : theme.colors.gray[0];
  const styleInput = styles?.input;
  const inputBorder =
    typeof styleInput?.border === "string"
      ? styleInput.border
      : `2px solid ${borderColor}`;
  const inputBorderRadius =
    typeof styleInput?.borderRadius === "number"
      ? styleInput.borderRadius
      : typeof styleInput?.borderRadius === "string"
        ? Number.parseInt(styleInput.borderRadius, 10)
        : 12;
  const mergedStyles = {
    ...styles,
    input: {
      ...(styles?.input ?? {}),
      borderTopLeftRadius: 0,
      borderBottomLeftRadius: 0,
      borderTopRightRadius: inputBorderRadius,
      borderBottomRightRadius: inputBorderRadius,
      border: inputBorder
    },
    error: {
      marginTop: "5px",
      ...(styles?.error ?? {})
    }
  };

  return (
    <Box>
      <Group gap={0} wrap="nowrap">
        <Text
          size="sm"
          style={{
            background: bgColor,
            padding: "6px 8px",
            borderRadius: `${inputBorderRadius}px 0 0 ${inputBorderRadius}px`,
            border: inputBorder,
            borderRight: "none"
          }}
        >
          {prefix}
        </Text>
        <TextInput
          w="100%"
          styles={mergedStyles}
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
