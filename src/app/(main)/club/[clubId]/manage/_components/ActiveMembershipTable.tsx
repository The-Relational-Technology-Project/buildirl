import {
  Button,
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
import { isLoaded } from "~/client/utils";
import React from "react";
import { useRouter } from "next/navigation";
import { PAGE_WIDTH } from "~/client/components/HeaderBar";
import UserAvatar from "~/client/components/UserAvatar";
import { Membership } from "~/server/membership/types";
import { useMounted } from "@mantine/hooks";
import RoleBadge from "~/client/components/RoleBadge";
import { billingIntervalLabel } from "~/client/utils";
import { MembershipExportButton } from "./MembershipExportButton";

type ActiveMembershipTableProps = {
  clubId: number;
};

export default function ActiveMembershipTable({
  clubId
}: ActiveMembershipTableProps) {
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const mounted = useMounted();

  const router = useRouter();

  const activeMembershipsForClubWithEmail =
    api.main.activeMembershipsForClubWithEmail.useQuery({
      clubId: clubId
    });

  QueryError.check({
    result: activeMembershipsForClubWithEmail,
    fieldName: "activeMembershipsForClubWithEmail"
  });

  if (!isLoaded(activeMembershipsForClubWithEmail)) {
    return null;
  }

  const rows = activeMembershipsForClubWithEmail.data!.map((m: Membership) => (
    <Table.Tr
      key={m.id}
      style={{ cursor: "pointer" }}
      onClick={() => router.push(`/club/${clubId}/member/${m.user.id}/review`)}
    >
      <Table.Td>
        <Group gap={"sm"} wrap={"nowrap"}>
          <UserAvatar size={"sm"} user={m.user} />
          <Text
            size={"sm"}
            style={{ textWrap: "nowrap" }}
          >{`${m.user.firstName} ${m.user.lastName}`}</Text>
        </Group>
      </Table.Td>
      <Table.Td>
        <Text size={"sm"} style={{ textWrap: "nowrap" }}>
          {m.membershipTier.name}
        </Text>
      </Table.Td>
      <Table.Td>
        <Text size={"sm"} style={{ textWrap: "nowrap" }}>
          {`$${m.membershipTier.costPerBillingInterval}.00/${billingIntervalLabel(m.membershipTier.billingInterval)}`}
        </Text>
      </Table.Td>
      <Table.Td>
        <RoleBadge role={m.role} hideMember />
      </Table.Td>
      <Table.Td>
        {m.email === null ? null : (
          <Text size="sm" style={{ textWrap: "nowrap" }}>
            {m.email}
          </Text>
        )}
      </Table.Td>
      <Table.Td onClick={(e) => e.stopPropagation()}>
        <Button
          color="blue"
          size="xs"
          onClick={() =>
            router.push(`/club/${clubId}/member/${m.user.id}/review`)
          }
        >
          Manage Member
        </Button>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    mounted && (
      <Stack mt={"lg"} gap={0}>
        <Stack px={4} gap={4}>
          <Group justify="space-between" align="center">
            <Title order={4}>Active Members</Title>
          </Group>
          <Group justify="space-between" align="center">
            <Group gap={4}>
              <Text
                fw={"bold"}
                size={"sm"}
              >{`${activeMembershipsForClubWithEmail.data!.length}`}</Text>
              <Text size={"sm"}>members</Text>
            </Group>
            <MembershipExportButton
              membership={activeMembershipsForClubWithEmail.data!}
              filename="active-members"
            />
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
                    colorScheme === "dark" ? theme.other.dark.surfaceDeep : "white"
                }}
              >
                <Table.Tr>
                  <Table.Th>User</Table.Th>
                  <Table.Th>Tier</Table.Th>
                  <Table.Th>Contribution</Table.Th>
                  <Table.Th>Role</Table.Th>
                  <Table.Th>Email</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>{rows}</Table.Tbody>
            </Table>
          </ScrollArea>
        </Paper>
      </Stack>
    )
  );
}
