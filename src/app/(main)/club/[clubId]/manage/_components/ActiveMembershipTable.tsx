import {
  Button,
  Group,
  Paper,
  ScrollArea,
  Stack,
  Table,
  Text,
  Title,
  Box,
  useMantineColorScheme,
  useMantineTheme
} from "@mantine/core";
import { api } from "~/trpc/react";
import { QueryError } from "~/client/utils/QueryError";
import { isLoaded, toDisplayDate } from "~/client/utils";
import { storageClient } from "~/client/utils/storageClient";
import React from "react";
import { useRouter } from "next/navigation";
import EmailLink from "~/client/components/EmailLink";
import { PAGE_WIDTH } from "~/client/components/HeaderBar";
import ColorSchemeAwareActionIcon from "~/client/components/ColorSchemeAwareActionIcon";
import { IconListCheck } from "@tabler/icons-react";
import UserAvatar from "~/client/components/UserAvatar";

type ActiveMembershipTableProps = {
  clubId: number;
};

export default function ActiveMembershipTable({
  clubId
}: ActiveMembershipTableProps) {
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();

  const router = useRouter();

  const utils = api.useUtils();
  const deactivateMembership = api.main.deactivateMembership.useMutation({
    onSuccess: async () => {
      await utils.main.activeMembershipsForClub.invalidate({ clubId: clubId });
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
        onClick={() => router.push(`/user/${m.user.id}?back=true`)}
        style={{ cursor: "pointer" }}
      >
        <Group gap={"sm"} wrap={"nowrap"}>
          <UserAvatar size="md" user={m.user} />
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
        {m.email === null ? null : <EmailLink email={m.email} />}
      </Table.Td>
      <Table.Td>
        <ColorSchemeAwareActionIcon
          onClick={() =>
            router.push(`/club/${clubId}/member/${m.user.id}/application`)
          }
          variant={"transparent"}
        >
          <IconListCheck size={16} />
        </ColorSchemeAwareActionIcon>
      </Table.Td>

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
                <Table.Th>Date Joined</Table.Th>
                {/*Email*/}
                <Table.Th />
                {/* Application Questions */}
                <Table.Th />
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
