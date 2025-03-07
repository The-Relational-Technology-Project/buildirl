import { Group, GroupProps, Text, MantineSize } from "@mantine/core";
import { api } from "~/trpc/react";
import { QueryError } from "~/client/utils/QueryError";
import { isLoaded } from "~/client/utils";
import { IconUsers } from "@tabler/icons-react";
import ColorSchemeAwareThemeIcon from "~/client/components/ColorSchemeAwareThemeIcon";

type MemberCountStatisticProps = {
  clubId: number;
  textSize?: MantineSize | (string & {});
};

export default function MemberCountStatistic({
  clubId,
  textSize = "sm",
  ...props
}: MemberCountStatisticProps & GroupProps) {
  const r = api.main.clubStatistics.useQuery({ clubId: clubId });

  QueryError.check({
    result: r,
    fieldName: "clubStatistics"
  });

  return (
    isLoaded(r) && (
      <Group gap={4} {...props}>
        <ColorSchemeAwareThemeIcon size={"xs"}>
          <IconUsers />
        </ColorSchemeAwareThemeIcon>
        <Text size={textSize} fw={400}>
          {`${r.data!.memberCount} member${r.data!.memberCount > 1 ? "s" : ""}`}
        </Text>
      </Group>
    )
  );
}
