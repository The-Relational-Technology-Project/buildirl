import { Group, GroupProps, Text } from "@mantine/core";
import { IconCalendarWeek } from "@tabler/icons-react";
import { toDisplayMonth } from "~/client/utils";
import React from "react";
import ColorSchemeAwareThemeIcon from "~/client/components/ColorSchemeAwareThemeIcon";

type JoinedDateProps = {
  date: Date;
};

export default function JoinedDate({
  date,
  ...props
}: JoinedDateProps & GroupProps) {
  return (
    <Group gap={6} {...props}>
      <ColorSchemeAwareThemeIcon
        size={"xs"}
        c={"dimmed"}
        style={{
          backgroundColor: "transparent"
        }}
      >
        <IconCalendarWeek />
      </ColorSchemeAwareThemeIcon>
      <Text c={"dimmed"} size={"sm"}>
        Joined {toDisplayMonth(date)}
      </Text>
    </Group>
  );
}
