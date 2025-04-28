import React from "react";
import {
  Group,
  Text,
  TextInput,
  TextInputProps,
  useMantineTheme,
  useMantineColorScheme
} from "@mantine/core";

/**
 * A reusable input component with a prefix label (like instagram.com/)
 */
type PrefixedInputProps = {
  prefix: string;
  placeholder: string;
  required?: boolean;
  error?: string;
} & Omit<TextInputProps, 'required' | 'placeholder' | 'error'>;

export default function PrefixedInput({
  prefix,
  placeholder,
  required = false,
  error,
  ...inputProps
}: PrefixedInputProps) {
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";
  
  // Use theme colors instead of hardcoded values
  const borderColor = isDark ? theme.colors.dark[1] : theme.colors.dark[9];
  const bgColor = isDark ? theme.colors.dark[6] : theme.colors.gray[0];

  return (
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
        required={required}
        placeholder={placeholder}
        w="100%"
        styles={{
          input: {
            borderTopLeftRadius: 0,
            borderBottomLeftRadius: 0,
            border: `1px solid ${borderColor}`
          }
        }}
        error={error}
        {...inputProps}
      />
    </Group>
  );
} 