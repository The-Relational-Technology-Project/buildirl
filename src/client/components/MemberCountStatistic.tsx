import { Group, GroupProps, Text, MantineSize } from "@mantine/core";
import { api } from "~/trpc/react";
import { QueryError } from "~/client/utils/QueryError";
import { isLoaded } from "~/client/utils";
import { IconUsers } from "@tabler/icons-react";
import ColorSchemeAwareThemeIcon from "~/client/components/ColorSchemeAwareThemeIcon";
import React from "react";

type MemberCountStatisticProps = {
  clubId: number;
  textSize?: MantineSize | (string & {});
};

export default function MemberCountStatistic({
  clubId,
  textSize = "sm",
  ...props
}: MemberCountStatisticProps & GroupProps) {
  const clubStatistics = api.main.clubStatistics.useQuery({ clubId: clubId });

  QueryError.check({
    result: clubStatistics,
    fieldName: "clubStatistics"
  });

  return (
    isLoaded(clubStatistics) && (
      <Group gap={4} {...props}>
        <ColorSchemeAwareThemeIcon size={"xs"}>
          <IconUsers />
        </ColorSchemeAwareThemeIcon>
        <Text size={textSize} fw={400}>
          {`${clubStatistics.data!.memberCount} member${clubStatistics.data!.memberCount > 1 ? "s" : ""}`}
        </Text>
      </Group>
    )
  );
}
