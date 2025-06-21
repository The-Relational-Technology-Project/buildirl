"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, Suspense } from "react";
import { Stack, Title, Text, Paper } from "@mantine/core";
import WithLocalNavigationHeader from "~/client/components/WithLocalNavigationHeader";
import { api } from "~/trpc/react";
import { strictParseInt } from "~/utils";
import { handleDefaultMutationError, notifySuccess } from "~/client/logger";
import EmailEditor from "~/client/components/EmailEditor";

function CreateEmailBlastContent() {
  const { clubId } = useParams<{ clubId: string }>();
  const router = useRouter();
  const clubIdNumber = strictParseInt(clubId);

  const [subject, setSubject] = useState("");
  const [htmlContent, setHtmlContent] = useState("");

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

  const handleContentChange = (newSubject: string, newHtmlContent: string) => {
    setSubject(newSubject);
    setHtmlContent(newHtmlContent);
  };

  const handleSave = async () => {
    await createEmailBlast.mutateAsync({
      clubId: clubIdNumber,
      input: {
        subject,
        htmlContent,
        textContent: ""
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
        <EmailEditor
          subject={subject}
          htmlContent={htmlContent}
          onContentChange={handleContentChange}
          onSave={handleSave}
          onCancel={handleCancel}
          saveButtonLoading={createEmailBlast.isPending}
          saveButtonText="Create Draft"
          showDeleteButton={false}
          showSendButton={false}
        />
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
