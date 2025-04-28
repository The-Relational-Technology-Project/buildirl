import { Group, GroupProps, Text, MantineSize } from "@mantine/core";
import { api } from "~/trpc/react";
import { QueryError } from "~/client/utils/QueryError";
import { isLoaded } from "~/client/utils";
import { IconUsers } from "@tabler/icons-react";
import ColorSchemeAwareThemeIcon from "~/client/components/ColorSchemeAwareThemeIcon";
import React from "react";

type ClubStatistics = {
  memberCount: number;
};

type MemberCountStatisticProps = {
  clubId: number;
  textSize?: MantineSize | (string & {});
  clubStatistics?: ClubStatistics;
};

export default function MemberCountStatistic({
  clubId,
  textSize = "sm",
  clubStatistics,
  ...props
}: MemberCountStatisticProps & GroupProps) {
  // Only fetch if not provided directly
  const r = !clubStatistics ? api.main.clubStatistics.useQuery({ clubId: clubId }) : null;

  if (r) {
    QueryError.check({
      result: r,
      fieldName: "clubStatistics"
    });
  }
  
  const stats = clubStatistics || (r && isLoaded(r) ? r.data : null);
  
  if (!stats) return null;

  return (
    <Group gap={4} {...props}>
      <ColorSchemeAwareThemeIcon size={"xs"}>
        <IconUsers />
      </ColorSchemeAwareThemeIcon>
      <Text size={textSize} fw={400}>
        {`${stats.memberCount} member${stats.memberCount > 1 ? "s" : ""}`}
      </Text>
    </Group>
  );
}
