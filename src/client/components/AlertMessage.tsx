import { Group, Text, TextProps, ThemeIcon } from "@mantine/core";
import { IconAlertTriangle } from "@tabler/icons-react";
import React from "react";

type AlertMessageProps = {
  message: string;
};
export function AlertMessage({
  message,
  ...props
}: AlertMessageProps & TextProps) {
  return (
    <Group gap={4}>
      <ThemeIcon color={"orange.5"} variant={"white"} size={"xs"}>
        <IconAlertTriangle />
      </ThemeIcon>
      <Text c={"orange.5"} {...props}>
        {message}
      </Text>
    </Group>
  );
}
