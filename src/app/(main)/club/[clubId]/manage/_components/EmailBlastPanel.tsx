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
  Box,
  TextInput,
  BoxProps
} from "@mantine/core";
import { IconPlus, IconSend, IconEdit, IconTrash, IconDeviceFloppy, IconEye } from "@tabler/icons-react";
import { api } from "~/trpc/react";
import { isLoaded } from "~/client/utils";
import { QueryError } from "~/client/utils/QueryError";
import { EmailBlast } from "~/server/email/types";
import { useState } from "react";
import { RichTextEditor } from "@mantine/tiptap";
import { Editor, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Link } from "@mantine/tiptap";
import { Underline } from "@tiptap/extension-underline";
import { Superscript } from "@tiptap/extension-superscript";
import { TextAlign } from "@tiptap/extension-text-align";
import { Subscript } from "@tiptap/extension-subscript";
import { Highlight } from "@tiptap/extension-highlight";
import { handleDefaultMutationError, notifyError, notifySuccess } from "~/client/logger";
import { Maybe } from "~/utils/types";

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

type ClickableEditorContentProps = {
  editor: Maybe<Editor>;
};

function ClickableEditorContent({
  editor,
  ...props
}: ClickableEditorContentProps & BoxProps) {
  const handleClick = () => {
    if (editor && !editor.isFocused) {
      editor.commands.focus("end");
    }
  };
  return <RichTextEditor.Content {...props} onClick={handleClick} />;
}

function EmailBlastEditor({ clubId, blast, onSave, onCancel, onDelete, onSend, readOnly }: EmailBlastEditorProps) {
  const [subject, setSubject] = useState(blast?.subject ?? "");
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

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link,
      Superscript,
      Subscript,
      Highlight,
      TextAlign.configure({ types: ["heading", "paragraph"] })
    ],
    content: blast?.htmlContent || "",
    editable: !isReadOnly
  });

  const handleSave = async () => {
    if (!editor || isReadOnly) {
      notifyError("Editor was not available during save; this is unexpected.");
      return;
    }

    setIsSaving(true);
    
    if (blast?.id) {
      // UPDATE existing blast
      await updateEmailBlast.mutateAsync({
        id: blast.id,
        input: {
          subject,
          htmlContent: editor.getHTML(),
          textContent: editor.getText()
        }
      });
    } else {
      // CREATE new blast
      await createEmailBlast.mutateAsync({
        clubId,
        input: {
          subject,
          htmlContent: editor.getHTML(),
          textContent: editor.getText()
        }
      });
    }
    
    if (!isSending) {
      onSave();
    }
  };

  const handleSaveAndSend = async () => {
    if (!editor || isReadOnly) {
      notifyError("Editor was not available during save; this is unexpected.");
      return;
    }
   
    try {
      setIsSaving(true);
      setIsSending(true);
      
      let blastId: bigint;
      
      if (blast?.id) {
        // UPDATE existing blast
        await updateEmailBlast.mutateAsync({
          id: blast.id,
          input: {
            subject,
            htmlContent: editor.getHTML(),
            textContent: editor.getText()
          }
        });
        blastId = blast.id;
      } else {
        // CREATE new blast
        const savedBlast = await createEmailBlast.mutateAsync({
          clubId,
          input: {
            subject,
            htmlContent: editor.getHTML(),
            textContent: editor.getText()
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
      <Stack gap="md">
        <TextInput
          label="Subject"
          placeholder="Enter email subject..."
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          readOnly={isReadOnly}
        />

        <Box>
          <Text size="sm" fw={500} mb={4}>Content</Text>
          <RichTextEditor editor={editor}>
            {!isReadOnly && (
              <RichTextEditor.Toolbar sticky stickyOffset={60}>
                <RichTextEditor.ControlsGroup>
                  <RichTextEditor.Bold />
                  <RichTextEditor.Italic />
                  <RichTextEditor.Underline />
                  <RichTextEditor.Strikethrough />
                  <RichTextEditor.ClearFormatting />
                  <RichTextEditor.Highlight />
                </RichTextEditor.ControlsGroup>

                <RichTextEditor.ControlsGroup>
                  <RichTextEditor.H1 />
                  <RichTextEditor.H2 />
                  <RichTextEditor.H3 />
                  <RichTextEditor.H4 />
                </RichTextEditor.ControlsGroup>

                <RichTextEditor.ControlsGroup>
                  <RichTextEditor.Blockquote />
                  <RichTextEditor.Hr />
                  <RichTextEditor.BulletList />
                  <RichTextEditor.OrderedList />
                  <RichTextEditor.Subscript />
                  <RichTextEditor.Superscript />
                </RichTextEditor.ControlsGroup>

                <RichTextEditor.ControlsGroup>
                  <RichTextEditor.Link />
                  <RichTextEditor.Unlink />
                </RichTextEditor.ControlsGroup>

                <RichTextEditor.ControlsGroup>
                  <RichTextEditor.AlignLeft />
                  <RichTextEditor.AlignCenter />
                  <RichTextEditor.AlignJustify />
                  <RichTextEditor.AlignRight />
                </RichTextEditor.ControlsGroup>
              </RichTextEditor.Toolbar>
            )}

            <ClickableEditorContent editor={editor} />
          </RichTextEditor>
        </Box>

        <Flex gap="md" justify="space-between">
          <Flex gap="md">
            <Button variant="light" onClick={onCancel}>
              {isReadOnly ? "Back to List" : "Cancel"}
            </Button>
            {!isReadOnly && (
              <Button 
                variant="light" 
                color="red" 
                leftSection={<IconTrash size={16} />} 
                onClick={handleDelete}
              >
                Delete
              </Button>
            )}
          </Flex>
          
          {!isReadOnly && (
            <Flex gap="md">
              <Button 
                leftSection={<IconSend size={16} />} 
                onClick={handleSaveAndSend}
                disabled={!canSend}
                loading={isSending}
                color="blue"
              >
                {blast?.status === "SENT" ? "Already Sent" : "Save & Send"}
              </Button>
              <Button 
                leftSection={<IconDeviceFloppy size={16} />} 
                onClick={handleSave}
                loading={
                  blast?.id 
                    ? (isSaving && !isSending) ? updateEmailBlast.isPending : false
                    : (isSaving && !isSending) ? createEmailBlast.isPending : false
                }
              >
                Save
              </Button>
            </Flex>
          )}
        </Flex>
      </Stack>
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