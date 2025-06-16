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
import { IconPlus, IconSend, IconEdit, IconTrash } from "@tabler/icons-react";
import { api } from "~/trpc/react";
import { isLoaded } from "~/client/utils";
import { QueryError } from "~/client/utils/QueryError";
import { EmailBlast } from "~/server/email/types";
import { useState } from "react";

type EmailBlastPanelProps = {
  clubId: number;
};

type EmailBlastListProps = {
  emailBlasts: EmailBlast[];
  onSelect: (blast: EmailBlast) => void;
  onDelete: (id: bigint) => void;
  onSend: (id: bigint) => void;
};

function EmailBlastList({ emailBlasts, onSelect, onDelete, onSend }: EmailBlastListProps) {
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
                  onClick={() => onSelect(blast)}
                  fw={500}
                >
                  {blast.subject || "Untitled"}
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
                  {new Date(blast.updatedAt).toLocaleDateString()}
                </Text>
              </Table.Td>
              <Table.Td>
                <Group gap="xs">
                  <ActionIcon
                    variant="subtle"
                    onClick={() => onSelect(blast)}
                    aria-label="Edit"
                  >
                    <IconEdit size={16} />
                  </ActionIcon>
                  {blast.status === "DRAFT" && (
                    <ActionIcon
                      variant="subtle"
                      color="blue"
                      onClick={() => onSend(blast.id)}
                      aria-label="Send"
                    >
                      <IconSend size={16} />
                    </ActionIcon>
                  )}
                  <ActionIcon
                    variant="subtle"
                    color="red"
                    onClick={() => onDelete(blast.id)}
                    aria-label="Delete"
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                </Group>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Paper>
  );
}

export default function EmailBlastPanel({ clubId }: EmailBlastPanelProps) {
  const [selectedBlast, setSelectedBlast] = useState<EmailBlast | null>(null);

  const emailBlasts = api.email.emailBlasts.useQuery({ clubId });

  QueryError.checkNullable({
    result: emailBlasts,
    fieldName: "emailBlasts"
  });

  const handleCreateNew = () => {
    // TODO: Implement create new blast
    console.log("Create new email blast for club", clubId);
  };

  const handleSelect = (blast: EmailBlast) => {
    setSelectedBlast(blast);
    // TODO: Implement email blast editor
    console.log("Selected email blast:", blast.id);
  };

  const handleDelete = (id: bigint) => {
    // TODO: Implement delete
    console.log("Delete email blast:", id);
  };

  const handleSend = (id: bigint) => {
    // TODO: Implement send
    console.log("Send email blast:", id);
  };

  if (!isLoaded(emailBlasts)) {
    return (
      <Paper withBorder p="xl">
        <Text>Loading email blasts...</Text>
      </Paper>
    );
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

      <EmailBlastList
        emailBlasts={emailBlasts.data!}
        onSelect={handleSelect}
        onDelete={handleDelete}
        onSend={handleSend}
      />

      {selectedBlast && (
        <Paper withBorder p="md">
          <Text size="sm" c="dimmed">
            Selected: {selectedBlast.subject} (ID: {selectedBlast.id.toString()})
          </Text>
          <Text size="sm">
            Editor coming in next step...
          </Text>
        </Paper>
      )}
    </Stack>
  );
} 