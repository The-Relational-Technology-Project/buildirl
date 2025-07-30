"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Stack, Title, Text, Paper, Button, Flex, Group } from "@mantine/core";
import WithLocalNavigationHeader from "~/client/components/WithLocalNavigationHeader";
import { api } from "~/trpc/react";
import { isLoaded } from "~/client/utils";
import { QueryError } from "~/client/utils/QueryError";
import { strictParseInt } from "~/utils";
import { handleDefaultMutationError, notifySuccess } from "~/client/logger";
import EmailEditorInput from "~/client/components/EmailEditorInput";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Link } from "@mantine/tiptap";
import { Underline } from "@tiptap/extension-underline";
import { Superscript } from "@tiptap/extension-superscript";
import { TextAlign } from "@tiptap/extension-text-align";
import { Subscript } from "@tiptap/extension-subscript";
import { Highlight } from "@tiptap/extension-highlight";
import { IconDeviceFloppy, IconSend, IconTrash } from "@tabler/icons-react";
import EmailVariableDoc from "~/client/components/EmailVariableDoc";
import { getEmailBlastVariables } from "~/utils/email";

function EmailBlastEditorContent() {
  const params = useParams<{ clubId: string; id: string }>();
  const router = useRouter();
  const clubId = strictParseInt(params.clubId);

  const emailBlasts =
    api.email.emailBlasts.useQuery({ clubId: clubId }) || null;

  QueryError.checkNullable({
    result: emailBlasts,
    fieldName: "emailBlasts"
  });

  const blast = emailBlasts.data?.find((b) => b.id.toString() === params.id);

  if (blast === undefined) {
    throw new Error("blast was not found, this is not expected");
  }

  const isViewMode = blast?.status === "SENT";

  const [subject, setSubject] = useState(blast?.subject ?? "");
  const [htmlContent, setHtmlContent] = useState(blast?.htmlContent ?? "");
  const [textContent, setTextContent] = useState(blast?.textContent ?? "");

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
    content: htmlContent,
    editable: !isViewMode,
    onUpdate: ({ editor }) => {
      setHtmlContent(editor.getHTML());
      setTextContent(editor.getText());
    }
  });

  useEffect(() => {
    setSubject(blast.subject);
    setHtmlContent(blast.htmlContent);
    setTextContent(blast.textContent);
    if (editor) {
      editor.commands.setContent(blast.htmlContent);
    }
  }, [blast, editor]);

  const utils = api.useUtils();

  const updateEmailBlast = api.email.updateEmailBlast.useMutation({
    onSuccess: () => {
      utils.email.emailBlasts.invalidate({ clubId: clubId });
      notifySuccess("Success", "Email blast has been saved");
    },
    onError: (e) => {
      handleDefaultMutationError(e);
    }
  });

  const deleteEmailBlast = api.email.deleteEmailBlast.useMutation({
    onSuccess: () => {
      utils.email.emailBlasts.invalidate({ clubId: clubId });
      notifySuccess("Success", "Email blast has been deleted");
      router.push(`/club/${clubId}/manage?tab=email`);
    },
    onError: (e) => {
      handleDefaultMutationError(e);
    }
  });

  const sendEmailBlast = api.email.sendEmailBlast.useMutation({
    onSuccess: () => {
      utils.email.emailBlasts.invalidate({ clubId: clubId });
      notifySuccess("Success", "Email blast has been sent");
    },
    onError: (e) => {
      handleDefaultMutationError(e);
    }
  });

  const handleContentChange = (
    newSubject: string,
    newHtmlContent: string,
    newTextContent: string
  ) => {
    setSubject(newSubject);
    setHtmlContent(newHtmlContent);
    setTextContent(newTextContent);
  };

  const handleSave = async () => {
    // TODO! these runtime check is only needed because of the generalization of
    //  the EmailEditor fails to enforce this with the type system. It should be removed
    //  once the EmailEditor is refactored
    if (isViewMode) {
      throw new Error("unexpected operation  in read-only mode.");
    }

    await updateEmailBlast.mutateAsync({
      id: blast.id,
      input: {
        subject,
        htmlContent,
        textContent
      }
    });

    router.push(`/club/${clubId}/manage?tab=email`);
  };

  const handleSaveAndSend = async () => {
    if (isViewMode) {
      throw new Error("unexpected operation  in read-only mode.");
    }

    const confirmed = window.confirm(
      "Are you sure you want to send this email blast to all active members? This action cannot be undone."
    );

    await updateEmailBlast.mutateAsync({
      id: blast.id,
      input: {
        subject,
        htmlContent,
        textContent
      }
    });

    if (confirmed) {
      await sendEmailBlast.mutateAsync({ id: blast.id });
    }

    router.push(`/club/${clubId}/manage?tab=email`);
  };

  const handleDelete = async () => {
    if (isViewMode) {
      throw new Error("unexpected operation  in read-only mode.");
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this email blast? This action cannot be undone."
    );
    if (confirmed) {
      await deleteEmailBlast.mutateAsync({ id: blast.id });
    }
  };

  const handleCancel = () => {
    router.push(`/club/${clubId}/manage?tab=email`);
  };

  if (!isLoaded(emailBlasts)) {
    return null;
  }

  return (
    <Stack gap="md">
      <Title order={3}>
        {isViewMode ? "View Email Blast" : "Edit Email Blast"}
      </Title>
      <Text size="sm" c="dimmed">
        {isViewMode
          ? "View the content of this sent email blast"
          : "Edit and manage your email blast"}
      </Text>

      {!isViewMode && (
        <EmailVariableDoc 
          variables={getEmailBlastVariables()}
          title="Available Variables for Email Blast"
          subtitle="Use these variables to personalize your email blast. They will be automatically replaced when the email is sent to each member."
        />
      )}

      <Paper withBorder p="xl">
        <EmailEditorInput
          editor={editor!}
          subject={subject}
          htmlContent={htmlContent}
          onContentChange={handleContentChange}
          readOnly={isViewMode}
        />
        <Flex gap="md" mt="md" justify="space-between">
          {!isViewMode ? (
            <>
              <Group gap={"md"}>
                <Button variant="light" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button
                  variant="light"
                  color="red"
                  onClick={handleDelete}
                  leftSection={<IconTrash size={16} />}
                >
                  Delete
                </Button>
              </Group>

              <Group gap={"md"}>
                <Button
                  onClick={handleSaveAndSend}
                  loading={
                    updateEmailBlast.isPending || sendEmailBlast.isPending
                  }
                  disabled={isViewMode}
                  leftSection={<IconSend size={16} />}
                  color={"blue"}
                >
                  {"Save & Send"}
                </Button>

                <Button
                  onClick={handleSave}
                  loading={updateEmailBlast.isPending}
                  leftSection={<IconDeviceFloppy size={16} />}
                >
                  Save
                </Button>
              </Group>
            </>
          ) : (
            <Button variant={"light"} onClick={handleCancel}>
              Back to List
            </Button>
          )}
        </Flex>
      </Paper>
    </Stack>
  );
}

export default function EmailBlastEditorPage() {
  const { clubId } = useParams<{ clubId: string }>();

  return (
    <WithLocalNavigationHeader navigateTo={`/club/${clubId}/manage?tab=email`}>
      <EmailBlastEditorContent />
    </WithLocalNavigationHeader>
  );
}
