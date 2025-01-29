import { Group, GroupProps, Text, ThemeIcon } from "@mantine/core";
import { api } from "~/trpc/react";
import { QueryError } from "~/client/utils/QueryError";
import { isLoaded } from "~/client/utils";
import { IconUsers } from "@tabler/icons-react";

type MemberCountStatisticProps = {
  clubId: number;
};

export function MemberCountStatistic({
  clubId,
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
        <ThemeIcon
          size={"xs"}
          variant={"white"}
          c={"black"}
          style={{
            backgroundColor: "transparent"
          }}
        >
          <IconUsers />
        </ThemeIcon>
        <Text size={"sm"} fw={400}>
          {`${r.data!.memberCount} member${r.data!.memberCount > 1 && "s"}`}
        </Text>
      </Group>
    )
  );
}
