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
  Box,
  ActionIcon,
  Anchor
} from "@mantine/core";
import { api } from "~/trpc/react";
import { QueryError } from "~/client/utils/QueryError";
import { isLoaded, toDisplayDate } from "~/client/utils";
import { storageClient } from "~/client/utils/storageClient";
import React from "react";
import { useRouter } from "next/navigation";
import { IconListCheck } from "@tabler/icons-react";
import { EmailLink } from "~/client/components/EmailLink";

type MembershipApplicationTableProps = {
  clubId: number;
};

export function MembershipApplicationTable({
  clubId
}: MembershipApplicationTableProps) {
  const router = useRouter();

  const utils = api.useUtils();
  const approveMembershipApplication =
    api.main.approveMembershipApplication.useMutation({
      onSuccess: async () => {
        await utils.main.membershipApplicationsForClub.invalidate({
          clubId: clubId
        });
        await utils.main.activeMembershipsForClub.invalidate({
          clubId: clubId
        });
      }
    });
  const declineMembershipApplication =
    api.main.declineMembershipApplication.useMutation({
      onSuccess: async () => {
        await utils.main.membershipApplicationsForClub.invalidate({
          clubId: clubId
        });
      }
    });

  const r = api.main.membershipApplicationsForClub.useQuery({ clubId: clubId });

  QueryError.check({
    result: r,
    fieldName: "membershipApplicationsForClub"
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
        {m.email === null ? null : <EmailLink email={m.email} />}
      </Table.Td>
      <Table.Td>
        <ActionIcon
          onClick={() =>
            router.push(`/club/${clubId}/member/${m.user.id}/application`)
          }
          variant={"transparent"}
          color={"black"}
        >
          <IconListCheck size={16} />
        </ActionIcon>
      </Table.Td>

      <Table.Td>
        <Group>
          <Button
            color={"green"}
            size={"xs"}
            onClick={async () =>
              await approveMembershipApplication.mutateAsync({
                membershipId: m.id
              })
            }
          >
            Approve
          </Button>
          <Button
            color={"red"}
            size={"xs"}
            onClick={async () =>
              await declineMembershipApplication.mutateAsync({
                membershipId: m.id
              })
            }
          >
            Decline
          </Button>
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Stack mt={"lg"} gap={0}>
      <Box px={4}>
        <Title order={4}>Pending Applications</Title>
        <Group gap={4}>
          <Text fw={"bold"} size={"sm"}>{`${r.data!.length}`}</Text>
          <Text size={"sm"}>new applications!</Text>
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
                <Table.Th>Date Applied</Table.Th>
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
