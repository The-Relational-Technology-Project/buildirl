import {
  Button,
  Paper,
  ScrollArea,
  Stack,
  Table,
  Text,
  Title,
  Group,
  useMantineColorScheme,
  useMantineTheme
} from "@mantine/core";
import { api } from "~/trpc/react";
import { QueryError } from "~/client/utils/QueryError";
import { isLoaded, toDisplayDate } from "~/client/utils";
import React from "react";
import { useRouter } from "next/navigation";
import { PAGE_WIDTH } from "~/client/components/HeaderBar";
import UserAvatar from "~/client/components/UserAvatar";

type MembershipApplicationTableProps = {
  clubId: number;
};

export default function MembershipApplicationTable({
  clubId
}: MembershipApplicationTableProps) {
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const router = useRouter();
  const r = api.main.membershipApplicationsForClub.useQuery({ clubId: clubId });

  QueryError.check({
    result: r,
    fieldName: "membershipApplicationsForClub"
  });

  if (!isLoaded(r)) {
    return null;
  }

  const rows = r.data!.map((m) => (
    <Table.Tr 
      key={m.id} 
      style={{ cursor: "pointer" }}
      onClick={() => router.push(`/club/${clubId}/member/${m.user.id}/application`)}
    >
      <Table.Td>
        <Group gap={"sm"} wrap="nowrap">
          <UserAvatar size={"sm"} user={m.user} />
          <Text
            size={"sm"}
            style={{ textWrap: "nowrap" }}
          >{`${m.user.firstName} ${m.user.lastName}`}</Text>
        </Group>
      </Table.Td>
      <Table.Td>{m.membershipTier.name}</Table.Td>
      <Table.Td>{`$${m.membershipTier.costPerMonthInUSD}.00/month`}</Table.Td>
      <Table.Td>{`${toDisplayDate(m.createdAt)}`}</Table.Td>
      <Table.Td>
        {m.email === null ? null : (
          <Text size="sm">{m.email}</Text>
        )}
      </Table.Td>
      <Table.Td onClick={(e) => e.stopPropagation()}>
        <Button
          color="blue"
          size="xs"
          onClick={() =>
            router.push(`/club/${clubId}/member/${m.user.id}/application`)
          }
        >
          Review Application
        </Button>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Stack mt={"lg"} gap={0}>
      <Stack px={4} gap={4}>
        <Title order={4}>Pending Applications</Title>
        <Group gap={4}>
          <Text fw={"bold"} size={"sm"}>{`${r.data!.length}`}</Text>
          <Text size={"sm"}>new applications</Text>
        </Group>
      </Stack>
      <Paper mt={"sm"} px={"md"} py={"sm"}>
        <ScrollArea h={300}>
          <Table miw={{ base: undefined, md: `calc(${PAGE_WIDTH} - 100px)` }}>
            <Table.Thead
              style={{
                position: "sticky",
                top: 0,
                background:
                  colorScheme === "dark" ? theme.colors.dark[7] : "white"
              }}
            >
              <Table.Tr>
                <Table.Th>User</Table.Th>
                <Table.Th>Tier</Table.Th>
                <Table.Th>Contribution</Table.Th>
                <Table.Th>Date Applied</Table.Th>
                <Table.Th>Email</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>{rows}</Table.Tbody>
          </Table>
        </ScrollArea>
      </Paper>
    </Stack>
  );
}
