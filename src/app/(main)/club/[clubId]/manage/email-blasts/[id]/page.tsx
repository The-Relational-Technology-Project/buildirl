"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { Stack, Title, Text, Paper } from "@mantine/core";
import WithLocalNavigationHeader from "~/client/components/WithLocalNavigationHeader";
import { api } from "~/trpc/react";
import { isLoaded } from "~/client/utils";
import { QueryError } from "~/client/utils/QueryError";
import { strictParseInt } from "~/utils";
import { handleDefaultMutationError, notifyError, notifySuccess } from "~/client/logger";
import EmailEditor from "~/client/components/EmailEditor";

function EmailBlastEditorContent() {
  const { clubId, id } = useParams<{ clubId: string; id: string }>();
  const router = useRouter();
  const clubIdNumber = strictParseInt(clubId);
  const isCreating = id === 'new';

  const emailBlasts = api.email.emailBlasts.useQuery(
    { clubId: clubIdNumber },
    { enabled: !isCreating }
  );

  QueryError.checkNullable({
    result: emailBlasts,
    fieldName: "emailBlasts"
  });

  const blast = isCreating 
    ? null 
    : emailBlasts.data?.find(b => b.id.toString() === id) || null;
  const isViewMode = blast?.status === "SENT";
  const isReadOnly = isViewMode;

  const [subject, setSubject] = useState(blast?.subject ?? "");
  const [htmlContent, setHtmlContent] = useState(blast?.htmlContent ?? "");

  useEffect(() => {
    if (blast) {
      setSubject(blast.subject);
      setHtmlContent(blast.htmlContent);
    }
  }, [blast]);

  const utils = api.useUtils();
  const createEmailBlast = api.email.createEmailBlast.useMutation({
    onSuccess: () => {
      utils.email.emailBlasts.invalidate({ clubId: clubIdNumber });
      notifySuccess("Success", "Email blast has been saved");
    },
    onError: (e) => {
      handleDefaultMutationError(e);
    }
  });

  const updateEmailBlast = api.email.updateEmailBlast.useMutation({
    onSuccess: () => {
      utils.email.emailBlasts.invalidate({ clubId: clubIdNumber });
      notifySuccess("Success", "Email blast has been saved");
    },
    onError: (e) => {
      handleDefaultMutationError(e);
    }
  });

  const deleteEmailBlast = api.email.deleteEmailBlast.useMutation({
    onSuccess: () => {
      utils.email.emailBlasts.invalidate({ clubId: clubIdNumber });
      notifySuccess("Success", "Email blast has been deleted");
      router.push(`/club/${clubId}/manage?tab=email`);
    },
    onError: (e) => {
      handleDefaultMutationError(e);
    }
  });

  const sendEmailBlast = api.email.sendEmailBlast.useMutation({
    onSuccess: () => {
      utils.email.emailBlasts.invalidate({ clubId: clubIdNumber });
      notifySuccess("Success", "Email blast has been sent");
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
    if (isReadOnly) {
      notifyError("Cannot save in read-only mode.");
      return;
    }
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
        clubId: clubIdNumber,
        input: {
          subject,
          htmlContent,
          textContent: ""
        }
      });
    }
    
    router.push(`/club/${clubId}/manage?tab=email`);
  };

  const handleSaveAndSend = async () => {
    if (isReadOnly) {
      notifyError("Cannot save and send in read-only mode.");
      return;
    }
   
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
        clubId: clubIdNumber,
        input: {
          subject,
          htmlContent,
          textContent: ""
        }
      });
      blastId = savedBlast.id;
    }

    const confirmed = window.confirm(
      "Are you sure you want to send this email blast to all active members? This action cannot be undone."
    );
    if (confirmed) {
      await sendEmailBlast.mutateAsync({ id: blastId });
    }
    
    router.push(`/club/${clubId}/manage?tab=email`);
  };

  const handleDelete = async () => {
    if (!blast?.id || isReadOnly) {
      router.push(`/club/${clubId}/manage?tab=email`);
      return;
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

  if (!isCreating && !isLoaded(emailBlasts)) {
    return null;
  }

  const canSend = blast?.status !== "SENT" && !isReadOnly;

  return (
    <Stack gap="md">
      <Title order={3}>
        {isCreating 
          ? "Create Email Blast"
          : isViewMode 
            ? "View Email Blast" 
            : "Edit Email Blast"
        }
      </Title>
      <Text size="sm" c="dimmed">
        {isCreating
          ? "Create a new email blast for your members"
          : isViewMode 
            ? "View the content of this sent email blast"
            : "Edit and manage your email blast"
        }
      </Text>

      <Paper withBorder p="xl">
        <EmailEditor
          subject={subject}
          htmlContent={htmlContent}
          onContentChange={handleContentChange}
          readOnly={isReadOnly}
          onSave={handleSave}
          onSend={handleSaveAndSend}
          onDelete={handleDelete}
          onCancel={handleCancel}
          saveButtonLoading={updateEmailBlast.isPending || createEmailBlast.isPending}
          sendButtonLoading={sendEmailBlast.isPending}
          sendButtonDisabled={!canSend}
          sendButtonText={blast?.status === "SENT" ? "Already Sent" : "Save & Send"}
          showDeleteButton={true}
          showSendButton={true}
        />
      </Paper>
    </Stack>
  );
}

export default function EmailBlastEditorPage() {
  const { clubId } = useParams<{ clubId: string }>();

  return (
    <WithLocalNavigationHeader navigateTo={`/club/${clubId}/manage?tab=email`}>
      <Suspense fallback={null}>
        <EmailBlastEditorContent />
      </Suspense>
    </WithLocalNavigationHeader>
  );
} 