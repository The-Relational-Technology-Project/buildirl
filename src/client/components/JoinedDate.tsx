import { Group, GroupProps, Text, ThemeIcon } from "@mantine/core";
import { IconCalendarWeek } from "@tabler/icons-react";
import { toDisplayMonth } from "~/client/utils";
import React from "react";

type JoinedDateProps = {
  date: Date;
};

export function JoinedDate({ date, ...props }: JoinedDateProps & GroupProps) {
  return (
    <Group gap={6} {...props}>
      <ThemeIcon
        size={"xs"}
        variant={"transparent"}
        c={"dimmed"}
        style={{
          backgroundColor: "transparent"
        }}
      >
        <IconCalendarWeek />
      </ThemeIcon>
      <Text c={"dimmed"} size={"sm"}>
        Joined {toDisplayMonth(date)}
      </Text>
    </Group>
  );
}
