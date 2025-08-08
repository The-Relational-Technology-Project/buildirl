import {
  Anchor,
  Group,
  Paper,
  ScrollArea,
  Stack,
  Table,
  Text,
  Title
} from "@mantine/core";
import { api } from "~/trpc/react";
import { QueryError } from "~/client/utils/QueryError";
import { isLoaded, toDisplayDate } from "~/client/utils";
import React from "react";
import { useRouter } from "next/navigation";
import { PAGE_WIDTH } from "~/client/components/HeaderBar";
import UserAvatar from "~/client/components/UserAvatar";

type ClubFollowerTableProps = {
  clubId: number;
};

export default function ClubFollowerTable({ clubId }: ClubFollowerTableProps) {
  const router = useRouter();
  const clubFollowers = api.main.clubFollowers.useQuery({ clubId: clubId });

  QueryError.check({
    result: clubFollowers,
    fieldName: "clubFollowers"
  });

  if (!isLoaded(clubFollowers)) {
    return null;
  }

  const rows = clubFollowers.data!.map((f) => (
    <Table.Tr key={f.user.id}>
      <Table.Td
        onClick={() => router.push(`/user/${f.user.id}?back=true`)}
        style={{ cursor: "pointer" }}
      >
        <Group gap={4} wrap="nowrap">
          <UserAvatar size={"sm"} user={f.user} />
          <Text
            size={"sm"}
            style={{ textWrap: "nowrap" }}
          >{`${f.user.firstName} ${f.user.lastName}`}</Text>
        </Group>
      </Table.Td>

      <Table.Td>
        <Text
          size={"sm"}
          style={{ textWrap: "nowrap" }}
        >{`${toDisplayDate(f.createdAt)}`}</Text>
      </Table.Td>

      <Table.Td>
        <Anchor
          size={"sm"}
          c={"black"}
          style={{ textWrap: "nowrap" }}
          href={`mailto:${f.email}`}
        >
          {f.email}
        </Anchor>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Stack mt={"lg"} gap={0}>
      <Stack px={4} gap={4}>
        <Group justify="space-between" align="center">
          <Title order={4}>Followers</Title>
        </Group>
        <Group gap={4}>
          <Text fw={"bold"} size={"sm"}>{`${clubFollowers.data!.length}`}</Text>
          <Text size={"sm"}>followers</Text>
        </Group>
      </Stack>
      <Paper mt={"sm"} px={"md"} py={"sm"}>
        <ScrollArea h={300}>
          <Table miw={{ base: undefined, md: `calc(${PAGE_WIDTH} - 100px)` }}>
            <Table.Thead
              style={{
                position: "sticky",
                top: 0
              }}
            >
              <Table.Tr>
                <Table.Th>User</Table.Th>
                <Table.Th>Date Followed</Table.Th>
                <Table.Th>Email</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>{rows}</Table.Tbody>
          </Table>
        </ScrollArea>
      </Paper>
    </Stack>
  );
}
