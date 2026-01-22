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
import { Membership } from "~/server/membership/types";
import { useMounted } from "@mantine/hooks";
import { billingIntervalLabel } from "~/client/utils";
import { MembershipExportButton } from "./MembershipExportButton";

type MembershipApplicationTableProps = {
  clubId: number;
};

export default function MembershipApplicationTable({
  clubId
}: MembershipApplicationTableProps) {
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const mounted = useMounted();

  const router = useRouter();
  const membershipApplicationsForClub =
    api.main.membershipApplicationsForClub.useQuery({ clubId: clubId });

  QueryError.check({
    result: membershipApplicationsForClub,
    fieldName: "membershipApplicationsForClub"
  });

  if (!isLoaded(membershipApplicationsForClub)) {
    return null;
  }

  const rows = membershipApplicationsForClub.data!.map((m: Membership) => (
    <Table.Tr
      key={m.id}
      style={{ cursor: "pointer" }}
      onClick={() => router.push(`/club/${clubId}/member/${m.user.id}/review`)}
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
      <Table.Td>
        <Text size={"sm"} style={{ textWrap: "nowrap" }}>
          {m.membershipTier.name}
        </Text>
      </Table.Td>
      <Table.Td>
        <Text
          size={"sm"}
          style={{ textWrap: "nowrap" }}
        >{`$${m.membershipTier.costPerBillingInterval}.00/${billingIntervalLabel(m.membershipTier.billingInterval)}`}</Text>
      </Table.Td>
      <Table.Td>
        <Text
          size={"sm"}
          style={{ textWrap: "nowrap" }}
        >{`${toDisplayDate(m.createdAt)}`}</Text>
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
          Review Application
        </Button>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    mounted && (
      <Stack mt={"lg"} gap={0}>
        <Stack px={4} gap={4}>
          <Group justify="space-between" align="center">
            <Title order={4}>Pending Applications</Title>
          </Group>
          <Group justify={"space-between"} align={"center"}>
            <Group gap={4}>
              <Text
                fw={"bold"}
                size={"sm"}
              >{`${membershipApplicationsForClub.data!.length}`}</Text>
              <Text size={"sm"}>new applications</Text>
            </Group>
            <MembershipExportButton
              membership={membershipApplicationsForClub.data!}
              filename="membership-applications"
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
                  <Table.Th>Date Applied</Table.Th>
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
