"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, Suspense } from "react";
import { Stack, Title, Text, Paper, Button, Flex } from "@mantine/core";
import WithLocalNavigationHeader from "~/client/components/WithLocalNavigationHeader";
import { api } from "~/trpc/react";
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
import { IconDeviceFloppy } from "@tabler/icons-react";

function CreateEmailBlastContent() {
  const { clubId } = useParams<{ clubId: string }>();
  const router = useRouter();
  const clubIdNumber = strictParseInt(clubId);

  const [subject, setSubject] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [textContent, setTextContent] = useState("");

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
    onUpdate: ({ editor }) => {
      setHtmlContent(editor.getHTML());
      setTextContent(editor.getText());
    }
  });

  const utils = api.useUtils();
  const createEmailBlast = api.email.createEmailBlast.useMutation({
    onSuccess: () => {
      utils.email.emailBlasts.invalidate({ clubId: clubIdNumber });
      notifySuccess("Success", "Email blast has been created");
      router.push(`/club/${clubId}/manage?tab=email`);
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
    await createEmailBlast.mutateAsync({
      clubId: clubIdNumber,
      input: {
        subject,
        htmlContent,
        textContent
      }
    });
  };

  const handleCancel = () => {
    router.push(`/club/${clubId}/manage?tab=email`);
  };

  return (
    <Stack gap="md">
      <Title order={3}>Create Email Blast</Title>
      <Text size="sm" c="dimmed">
        Create a new email blast for your members
      </Text>

      <Paper withBorder p="xl">
        <EmailEditorInput
          editor={editor!}
          subject={subject}
          htmlContent={htmlContent}
          onContentChange={handleContentChange}
        />
        <Flex gap="md" mt="md">
          <Button
            onClick={handleSave}
            loading={createEmailBlast.isPending}
            leftSection={<IconDeviceFloppy size={16} />}
          >
            Create Draft
          </Button>
          <Button variant="subtle" onClick={handleCancel}>
            Cancel
          </Button>
        </Flex>
      </Paper>
    </Stack>
  );
}

export default function CreateEmailBlastPage() {
  const { clubId } = useParams<{ clubId: string }>();

  return (
    <WithLocalNavigationHeader navigateTo={`/club/${clubId}/manage?tab=email`}>
      <Suspense fallback={null}>
        <CreateEmailBlastContent />
      </Suspense>
    </WithLocalNavigationHeader>
  );
}
