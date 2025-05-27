import React from "react";
import { Stack, Text, Title, Divider, StackProps } from "@mantine/core";

type UserBioProps = {
  description: string;
  showDivider?: boolean;
  showTitle?: boolean;
  titleText?: string;
  textSize?: "xs" | "sm" | "md" | "lg" | "xl";
} & StackProps;

export default function UserBio({
  description,
  showDivider = true,
  showTitle = true,
  titleText = "Bio",
  textSize = "sm",
  ...stackProps
}: UserBioProps) {
  if (!description || description.trim() === "") {
    return null;
  }

  return (
    <>
      {showDivider && <Divider my="md" />}
      <Stack gap="xs" {...stackProps}>
        {showTitle && <Title order={4}>{titleText}</Title>}
        <Text size={textSize} style={{ whiteSpace: "pre-wrap" }}>
          {description}
        </Text>
      </Stack>
    </>
  );
} 