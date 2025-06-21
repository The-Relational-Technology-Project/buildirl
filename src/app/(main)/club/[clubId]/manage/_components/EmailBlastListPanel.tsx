import { 
  Paper, 
  Stack, 
  Title, 
  Text, 
  Button, 
  Table, 
  Badge, 
  Group,
  ActionIcon,
  Flex,
  Box
} from "@mantine/core";
import { IconPlus, IconEdit, IconTrash, IconEye } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { isLoaded, toDisplayDate } from "~/client/utils";
import { QueryError } from "~/client/utils/QueryError";
import { EmailBlast } from "~/server/email/types";
import { handleDefaultMutationError, notifySuccess } from "~/client/logger";

type EmailBlastListPanelProps = {
  clubId: number;
};

type EmailBlastTableProps = {
  emailBlasts: EmailBlast[];
  onEdit: (emailBlast: EmailBlast) => void;
  onView: (blast: EmailBlast) => void;
  onDelete: (emailBlastId: bigint) => void;
};

function EmailBlastTable({ emailBlasts, onEdit, onView, onDelete }: EmailBlastTableProps) {
  if (emailBlasts.length === 0) {
    return (
      <Paper withBorder p="xl">
        <Stack align="center" gap="md">
          <Text size="md" c="dimmed">
            No email blasts yet. Create your first one!
          </Text>
        </Stack>
      </Paper>
    );
  }

  return (
    <Paper withBorder>
      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Subject</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th>Updated</Table.Th>
            <Table.Th>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {emailBlasts.map((blast) => (
            <Table.Tr key={blast.id.toString()}>
              <Table.Td>
                <Text 
                  style={{ cursor: "pointer" }}
                  onClick={() => blast.status === "SENT" ? onView(blast) : onEdit(blast)}
                  fw={500}
                >
                  {blast.subject || <i>Untitled</i>}
                </Text>
              </Table.Td>
              <Table.Td>
                <Badge 
                  color={blast.status === "SENT" ? "green" : "gray"}
                  variant="light"
                >
                  {blast.status}
                </Badge>
              </Table.Td>
              <Table.Td>
                <Text size="sm" c="dimmed">
                  {toDisplayDate(new Date(blast.updatedAt))}
                </Text>
              </Table.Td>
              <Table.Td>
                <Group gap="xs">
                  {blast.status === "SENT" ? (
                    <ActionIcon
                      variant="subtle"
                      onClick={() => onView(blast)}
                      aria-label="View"
                    >
                      <IconEye size={16} />
                    </ActionIcon>
                  ) : (
                    <>
                      <ActionIcon
                        variant="subtle"
                        onClick={() => onEdit(blast)}
                        aria-label="Edit"
                      >
                        <IconEdit size={16} />
                      </ActionIcon>
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        onClick={() => onDelete(blast.id)}
                        aria-label="Delete"
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </>
                  )}
                </Group>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Paper>
  );
}

function EmailBlastListContent({ clubId }: EmailBlastListPanelProps) {
  const router = useRouter();
  
  const emailBlasts = api.email.emailBlasts.useQuery({ clubId });

  QueryError.checkNullable({
    result: emailBlasts,
    fieldName: "emailBlasts"
  });

  const utils = api.useUtils();
  const deleteEmailBlast = api.email.deleteEmailBlast.useMutation({
    onSuccess: () => {
      utils.email.emailBlasts.invalidate({ clubId });
      notifySuccess("Success", "Email blast has been deleted");
    },
    onError: (e) => {
      handleDefaultMutationError(e);
    }
  });

  const handleCreateNew = () => {
    router.push(`/club/${clubId}/manage/email-blasts/new`, { scroll: false });
  };

  const handleEdit = (emailBlast: EmailBlast) => {
    router.push(`/club/${clubId}/manage/email-blasts/${emailBlast.id}`, { scroll: false });
  };

  const handleView = (blast: EmailBlast) => {
    router.push(`/club/${clubId}/manage/email-blasts/${blast.id}`, { scroll: false });
  };

  const handleDelete = async (emailBlastId: bigint) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this email blast? This action cannot be undone."
    );
    if (confirmed) {
      await deleteEmailBlast.mutateAsync({ id: emailBlastId });
    }
  };

  if (!isLoaded(emailBlasts)) {
    return null;
  }

  return (
    <Stack gap="md">
      <Flex justify="space-between" align="center">
        <Box>
          <Title order={3}>Email Blasts</Title>
          <Text size="sm" c="dimmed">
            Send emails to all active members of your club
          </Text>
        </Box>
        <Button 
          leftSection={<IconPlus size={16} />}
          onClick={handleCreateNew}
        >
          Create New Blast
        </Button>
      </Flex>

      <EmailBlastTable
        emailBlasts={emailBlasts.data!}
        onEdit={handleEdit}
        onView={handleView}
        onDelete={handleDelete}
      />
    </Stack>
  );
}

export default function EmailBlastListPanel({ clubId }: EmailBlastListPanelProps) {
  return <EmailBlastListContent clubId={clubId} />;
} 