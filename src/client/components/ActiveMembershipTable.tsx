import {
  Button,
  Group,
  Paper,
  ScrollArea,
  Stack,
  Table,
  Text,
  Avatar,
  Title,
  Box
} from "@mantine/core";
import { api } from "~/trpc/react";
import { QueryError } from "~/client/utils/QueryError";
import { isLoaded, toDisplayDate } from "~/client/utils";
import { storageClient } from "~/client/utils/storageClient";
import React from "react";
import { useRouter } from "next/navigation";

type ActiveMembershipTableProps = {
  clubId: number;
};

export function ActiveMembershipTable({ clubId }: ActiveMembershipTableProps) {
  const router = useRouter();

  const utils = api.useUtils();
  const deactivateMembership = api.main.deactivateMembership.useMutation({
    onSuccess: async () => {
      await utils.main.activeMembershipsForClub.invalidate({ clubId: clubId });
      router.back();
    }
  });

  const r = api.main.activeMembershipsForClub.useQuery({ clubId: clubId });

  QueryError.check({
    result: r,
    fieldName: "activeMembershipsForClub"
  });

  if (!isLoaded(r)) {
    return null;
  }

  const rows = r.data!.map((m) => (
    <Table.Tr key={m.id}>
      <Table.Td
        miw={140}
        onClick={() => router.push(`/user/${m.user.id}?back=true`)}
        style={{ cursor: "pointer" }}
      >
        <Group gap={4}>
          <Avatar
            size="md"
            radius="xl"
            src={storageClient.userProfileImageUrl(m.user.id)}
          />
          <Text size={"sm"}>{`${m.user.firstName} ${m.user.lastName}`}</Text>
        </Group>
      </Table.Td>
      <Table.Td miw={100}>{m.membershipTier.name}</Table.Td>
      <Table.Td>{`$${m.membershipTier.costPerMonthInUSD}.00/month`}</Table.Td>
      <Table.Td>{`${toDisplayDate(m.createdAt)}`}</Table.Td>

      <Table.Td>
        <Button
          color={"red"}
          size={"xs"}
          onClick={async () =>
            await deactivateMembership.mutateAsync({
              membershipId: m.id
            })
          }
        >
          Cancel
        </Button>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Stack mt={"lg"} gap={0}>
      <Box px={4}>
        <Title order={4}>Active Members</Title>
        <Group gap={4}>
          <Text fw={"bold"} size={"sm"}>{`${r.data!.length}`}</Text>
          <Text size={"sm"}>members</Text>
        </Group>
      </Box>
      <Paper mt={"sm"} px={"md"} py={"sm"} withBorder>
        <ScrollArea h={300}>
          <Table miw={700}>
            <Table.Thead
              style={{
                position: "sticky",
                top: 0,
                backgroundColor: "white"
              }}
            >
              <Table.Tr>
                <Table.Th>User</Table.Th>
                <Table.Th>Tier</Table.Th>
                <Table.Th>Contribution</Table.Th>
                <Table.Th>Date Joined</Table.Th>
                <Table.Th>Action</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>{rows}</Table.Tbody>
          </Table>
        </ScrollArea>
      </Paper>
    </Stack>
  );
}
