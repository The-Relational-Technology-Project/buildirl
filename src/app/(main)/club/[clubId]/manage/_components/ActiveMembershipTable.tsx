import {
  Button,
  Center,
  Group,
  Paper,
  ScrollArea,
  Stack,
  Table,
  Text,
  Title,
  useMantineColorScheme,
  useMantineTheme
} from "@mantine/core";
import { api } from "~/trpc/react";
import { QueryError } from "~/client/utils/QueryError";
import { isLoaded, toDisplayDate } from "~/client/utils";
import React from "react";
import { useRouter } from "next/navigation";
import EmailLink from "~/client/components/EmailLink";
import { PAGE_WIDTH } from "~/client/components/HeaderBar";
import ColorSchemeAwareActionIcon from "~/client/components/ColorSchemeAwareActionIcon";
import { IconListCheck } from "@tabler/icons-react";
import UserAvatar from "~/client/components/UserAvatar";
import InactiveSubscriptionAlert from "~/client/components/InactiveSubscriptionAlert";
import { isDefaultFreeTier } from "~/utils/types";

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
      await utils.main.activeMembershipsForClub.invalidate({
        clubId: clubId
      });
      await utils.main.activeMembershipsForClubWithEmail.invalidate({
        clubId: clubId
      });
      await utils.main.clubStatistics.invalidate({ clubId: clubId });
    }
  });

  const r = api.main.activeMembershipsForClubWithEmail.useQuery({
    clubId: clubId
  });

  QueryError.check({
    result: r,
    fieldName: "activeMembershipsForClubWithEmail"
  });

  if (!isLoaded(r)) {
    return null;
  }

  const handleDeactivateMembership = (membershipId: bigint) => {
    if (
      window.confirm(
        "Are you sure you want to cancel this membership? This action cannot be undone."
      )
    ) {
      deactivateMembership.mutateAsync({
        membershipId: membershipId
      });
    }
  };

  const rows = r.data!.map((m) => (
    <Table.Tr key={m.id}>
      <Table.Td
        onClick={() => router.push(`/user/${m.user.id}?back=true`)}
        style={{ cursor: "pointer" }}
      >
        <Group gap={"sm"} wrap={"nowrap"}>
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
        {m.email === null ? null : <EmailLink email={m.email} />}
      </Table.Td>
      <Table.Td>
        <ColorSchemeAwareActionIcon
          onClick={() =>
            router.push(`/club/${clubId}/member/${m.user.id}/application`)
          }
        >
          <IconListCheck size={16} />
        </ColorSchemeAwareActionIcon>
      </Table.Td>

      <Table.Td>
        <Button
          color={"red"}
          size={"xs"}
          onClick={() => handleDeactivateMembership(m.id)}
        >
          Cancel
        </Button>
      </Table.Td>
      <Table.Td>
        <Center h={"100%"}>
          {!isDefaultFreeTier(m.membershipTier) && (
            <InactiveSubscriptionAlert membershipId={m.id} forClubOwner />
          )}
        </Center>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Stack mt={"lg"} gap={0}>
      <Stack px={4} gap={4}>
        <Title order={4}>Active Members</Title>
        <Group gap={4}>
          <Text fw={"bold"} size={"sm"}>{`${r.data!.length}`}</Text>
          <Text size={"sm"}>members</Text>
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
                <Table.Th>Date Joined</Table.Th>
                {/*Email*/}
                <Table.Th />
                {/* Application Questions */}
                <Table.Th />
                <Table.Th>Action</Table.Th>
                {/* Subscription Status */}
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
