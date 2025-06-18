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
import { api } from "~/trpc/react";
import { isLoaded } from "~/client/utils";
import { QueryError } from "~/client/utils/QueryError";
import { EmailBlast } from "~/server/email/types";
import { useState } from "react";
import { handleDefaultMutationError, notifyError, notifySuccess } from "~/client/logger";
import EmailEditor from "~/client/components/EmailEditor";

type EmailBlastPanelProps = {
  clubId: number;
};

type EmailBlastListProps = {
  emailBlasts: EmailBlast[];
  onSelect: (blast: EmailBlast) => void;
  onView: (blast: EmailBlast) => void;
  onDelete: (id: bigint) => void;
};

type EmailBlastEditorProps = {
  clubId: number;
  blast: EmailBlast | null;
  onSave: () => void;
  onCancel: () => void;
  onDelete: (id: bigint) => void;
  onSend: (id: bigint) => void;
  readOnly?: boolean;
};

function EmailBlastEditor({ clubId, blast, onSave, onCancel, onDelete, onSend, readOnly }: EmailBlastEditorProps) {
  const [subject, setSubject] = useState(blast?.subject ?? "");
  const [htmlContent, setHtmlContent] = useState(blast?.htmlContent ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  const isReadOnly = readOnly || blast?.status === "SENT";
  
  const utils = api.useUtils();
  const createEmailBlast = api.email.createEmailBlast.useMutation({
    onSuccess: () => {
      utils.email.emailBlasts.invalidate({ clubId });
      notifySuccess("Success", "Email blast has been saved");
      setIsSaving(false);
    },
    onError: (e) => {
      handleDefaultMutationError(e);
      setIsSaving(false);
    }
  });

  const updateEmailBlast = api.email.updateEmailBlast.useMutation({
    onSuccess: () => {
      utils.email.emailBlasts.invalidate({ clubId });
      notifySuccess("Success", "Email blast has been saved");
      setIsSaving(false);
    },
    onError: (e) => {
      handleDefaultMutationError(e);
      setIsSaving(false);
    }
  });

  const handleContentChange = (newSubject: string, newHtmlContent: string) => {
    setSubject(newSubject);
    setHtmlContent(newHtmlContent);
  };

  const handleSave = async () => {
    if (isReadOnly) {
      notifyError("Cannot save in read-only mode.");
      return;
    }

    setIsSaving(true);
    
    if (blast?.id) {
      await updateEmailBlast.mutateAsync({
        id: blast.id,
        input: {
          subject,
          htmlContent,
          textContent: ""
        }
      });
    } else {
      await createEmailBlast.mutateAsync({
        clubId,
        input: {
          subject,
          htmlContent,
          textContent: ""
        }
      });
    }
    
    if (!isSending) {
      onSave();
    }
  };

  const handleSaveAndSend = async () => {
    if (isReadOnly) {
      notifyError("Cannot save and send in read-only mode.");
      return;
    }
   
    try {
      setIsSaving(true);
      setIsSending(true);
      
      let blastId: bigint;
      
      if (blast?.id) {
        await updateEmailBlast.mutateAsync({
          id: blast.id,
          input: {
            subject,
            htmlContent,
            textContent: ""
          }
        });
        blastId = blast.id;
      } else {
        const savedBlast = await createEmailBlast.mutateAsync({
          clubId,
          input: {
            subject,
            htmlContent,
            textContent: ""
          }
        });
        blastId = savedBlast.id;
      }

      await onSend(blastId);
      
      setIsSending(false);
      onSave(); 
    } catch {
      setIsSending(false);
    }
  };

  const handleDelete = async () => {
    if (!blast?.id || isReadOnly) {
      onCancel();
      return;
    }
    await onDelete(blast.id);
  };

  const canSend = blast?.status !== "SENT" && !isReadOnly;

  return (
    <Paper withBorder p="xl">
      <EmailEditor
        subject={subject}
        htmlContent={htmlContent}
        onContentChange={handleContentChange}
        readOnly={isReadOnly}
        onSave={handleSave}
        onSend={handleSaveAndSend}
        onDelete={handleDelete}
        onCancel={onCancel}
        saveButtonLoading={isSaving && !isSending}
        sendButtonLoading={isSending}
        sendButtonDisabled={!canSend}
        sendButtonText={blast?.status === "SENT" ? "Already Sent" : "Save & Send"}
        showDeleteButton={true}
        showSendButton={true}
      />
    </Paper>
  );
}

function EmailBlastList({ emailBlasts, onSelect, onView, onDelete }: EmailBlastListProps) {
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
                  onClick={() => blast.status === "SENT" ? onView(blast) : onSelect(blast)}
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
                        onClick={() => onSelect(blast)}
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

export default function EmailBlastPanel({ clubId }: EmailBlastPanelProps) {
  const [selectedBlast, setSelectedBlast] = useState<EmailBlast | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [viewMode, setViewMode] = useState<"EDIT" | "VIEW" | null>(null);

  const emailBlasts = api.email.emailBlasts.useQuery({ clubId });

  QueryError.checkNullable({
    result: emailBlasts,
    fieldName: "emailBlasts"
  });

  const handleCreateNew = () => {
    setSelectedBlast(null);
    setViewMode("EDIT");
    setIsEditing(true);
  };

  const handleSelect = (blast: EmailBlast) => {
    setSelectedBlast(blast);
    setViewMode("EDIT");
    setIsEditing(true);
  };

  const handleView = (blast: EmailBlast) => {
    setSelectedBlast(blast);
    setViewMode("VIEW");
    setIsEditing(true);
  };

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

  const sendEmailBlast = api.email.sendEmailBlast.useMutation({
    onSuccess: () => {
      utils.email.emailBlasts.invalidate({ clubId });
      notifySuccess("Success", "Email blast has been sent");
    },
    onError: (e) => {
      handleDefaultMutationError(e);
    }
  });

  const handleDelete = async (id: bigint) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this email blast? This action cannot be undone."
    );
    if (confirmed) {
      await deleteEmailBlast.mutateAsync({ id });
      if (selectedBlast?.id === id) {
        setSelectedBlast(null);
        setIsEditing(false);
        setViewMode(null);
      }
    }
  };

  const handleSend = async (id: bigint) => {
    const confirmed = window.confirm(
      "Are you sure you want to send this email blast to all active members? This action cannot be undone."
    );
    if (confirmed) {
      await sendEmailBlast.mutateAsync({ id });
    }
  };

  const handleEditorSave = () => {
    setIsEditing(false);
    setViewMode(null);
  };

  const handleEditorCancel = () => {
    setIsEditing(false);
    setViewMode(null);
  };

  const handleBackToList = () => {
    setIsEditing(false);
    setSelectedBlast(null);
    setViewMode(null);
  };

  if (!isLoaded(emailBlasts)) {
    return (
      <Paper withBorder p="xl">
        <Text>Loading email blasts...</Text>
      </Paper>
    );
  }

  const isViewMode = viewMode === "VIEW";

  return (
    <Stack gap="md">
      <Flex justify="space-between" align="center">
        <Box>
          <Title order={3}>
            {isEditing 
              ? (isViewMode 
                  ? "View Email Blast" 
                  : selectedBlast ? "Edit Email Blast" : "Create Email Blast"
                )
              : "Email Blasts"
            }
          </Title>
          <Text size="sm" c="dimmed">
            {isEditing
              ? (isViewMode 
                  ? "View the content of this sent email blast" 
                  : selectedBlast ? "Edit and manage your email blast" : "Create a new email blast for your members"
                )
              : "Send emails to all active members of your club"
            }
          </Text>
        </Box>
        {isEditing ? (
          <Button 
            variant="light"
            onClick={handleBackToList}
          >
            Back to List
          </Button>
        ) : (
          <Button 
            leftSection={<IconPlus size={16} />}
            onClick={handleCreateNew}
          >
            Create New Blast
          </Button>
        )}
      </Flex>

      {isEditing ? (
        <EmailBlastEditor
          clubId={clubId}
          blast={selectedBlast}
          onSave={handleEditorSave}
          onCancel={handleEditorCancel}
          onDelete={handleDelete}
          onSend={handleSend}
          readOnly={isViewMode}
        />
      ) : (
        <EmailBlastList
          emailBlasts={emailBlasts.data!}
          onSelect={handleSelect}
          onView={handleView}
          onDelete={handleDelete}
        />
      )}
    </Stack>
  );
} 