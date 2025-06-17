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
import { IconPlus, IconSend, IconEdit, IconTrash, IconDeviceFloppy } from "@tabler/icons-react";
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
  onDelete: (id: bigint) => void;
};

type EmailBlastEditorProps = {
  clubId: number;
  blast: EmailBlast | null;
  onSave: () => void;
  onCancel: () => void;
  onDelete: (id: bigint) => void;
  onSend: (id: bigint) => void;
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

function EmailBlastEditor({ clubId, blast, onSave, onCancel, onDelete, onSend }: EmailBlastEditorProps) {
  const [subject, setSubject] = useState(blast?.subject ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  const utils = api.useUtils();
  const setEmailBlast = api.email.setEmailBlast.useMutation({
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
    content: blast?.htmlContent || ""
  });

  const handleSave = async () => {
    if (!editor) {
      notifyError("Editor was not available during save; this is unexpected.");
      return;
    }

    setIsSaving(true);
    await setEmailBlast.mutateAsync({
      id: blast?.id,
      clubId,
      input: {
        subject,
        htmlContent: editor.getHTML(),
        textContent: editor.getText()
      }
    });
    
    if (!isSending) {
      onSave();
    }
  };

  const handleSaveAndSend = async () => {
    if (!editor) {
      notifyError("Editor was not available during save; this is unexpected.");
      return;
    }

    const confirmed = window.confirm(
      "This will save and send the email blast to all active members. This action cannot be undone. Continue?"
    );
    if (!confirmed) return;
   
    try {
      setIsSaving(true);
      setIsSending(true);
      
      const savedBlast = await setEmailBlast.mutateAsync({
        id: blast?.id,
        clubId,
        input: {
          subject,
          htmlContent: editor.getHTML(),
          textContent: editor.getText()
        }
      });

      const blastId = blast?.id || savedBlast.id;
      await onSend(blastId);
      
      setIsSending(false);
      onSave(); 
    } catch {
      setIsSending(false);
    }
  };

  const handleDelete = async () => {
    if (!blast?.id) {
      onCancel();
      return;
    }
    await onDelete(blast.id);
  };

  const canSend = blast?.status !== "SENT";

  return (
    <Paper withBorder p="xl">
      <Stack gap="md">
        <TextInput
          label="Subject"
          placeholder="Enter email subject..."
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />

        <Box>
          <Text size="sm" fw={500} mb={4}>Content</Text>
          <RichTextEditor editor={editor}>
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

            <ClickableEditorContent editor={editor} />
          </RichTextEditor>
        </Box>

        <Flex gap="md" justify="space-between">
          <Flex gap="md">
            <Button variant="light" onClick={onCancel}>
              Cancel
            </Button>
            <Button 
              variant="light" 
              color="red" 
              leftSection={<IconTrash size={16} />} 
              onClick={handleDelete}
            >
              Delete
            </Button>
          </Flex>
          
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
              loading={isSaving && !isSending}
            >
              Save
            </Button>
          </Flex>
        </Flex>
      </Stack>
    </Paper>
  );
}

function EmailBlastList({ emailBlasts, onSelect, onDelete }: EmailBlastListProps) {
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
  const [isEditing, setIsEditing] = useState(false);

  const emailBlasts = api.email.emailBlasts.useQuery({ clubId });

  QueryError.checkNullable({
    result: emailBlasts,
    fieldName: "emailBlasts"
  });

  const handleCreateNew = () => {
    setSelectedBlast(null);
    setIsEditing(true);
  };

  const handleSelect = (blast: EmailBlast) => {
    setSelectedBlast(blast);
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
  };

  const handleEditorCancel = () => {
    setIsEditing(false);
  };

  const handleBackToList = () => {
    setIsEditing(false);
    setSelectedBlast(null);
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
          <Title order={3}>
            {isEditing 
              ? (selectedBlast ? "Edit Email Blast" : "Create Email Blast")
              : "Email Blasts"
            }
          </Title>
          <Text size="sm" c="dimmed">
            {isEditing
              ? (selectedBlast ? "Edit and manage your email blast" : "Create a new email blast for your members")
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
        />
      ) : (
        <EmailBlastList
          emailBlasts={emailBlasts.data!}
          onSelect={handleSelect}
          onDelete={handleDelete}
        />
      )}
    </Stack>
  );
} 