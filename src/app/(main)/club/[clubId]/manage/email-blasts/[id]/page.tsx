"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Stack, Title, Text, Paper } from "@mantine/core";
import WithLocalNavigationHeader from "~/client/components/WithLocalNavigationHeader";
import { api } from "~/trpc/react";
import { isLoaded } from "~/client/utils";
import { QueryError } from "~/client/utils/QueryError";
import { strictParseInt } from "~/utils";
import { handleDefaultMutationError, notifySuccess } from "~/client/logger";
import EmailEditor from "~/client/components/EmailEditor";

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

  useEffect(() => {
    setSubject(blast.subject);
    setHtmlContent(blast.htmlContent);
  }, [blast]);

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

  const handleContentChange = (newSubject: string, newHtmlContent: string) => {
    setSubject(newSubject);
    setHtmlContent(newHtmlContent);
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
        textContent: ""
      }
    });

    router.push(`/club/${clubId}/manage?tab=email`);
  };

  const handleSaveAndSend = async () => {
    if (isViewMode) {
      throw new Error("unexpected operation  in read-only mode.");
    }

    await updateEmailBlast.mutateAsync({
      id: blast.id,
      input: {
        subject,
        htmlContent,
        textContent: ""
      }
    });

    const confirmed = window.confirm(
      "Are you sure you want to send this email blast to all active members? This action cannot be undone."
    );
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

      <Paper withBorder p="xl">
        <EmailEditor
          subject={subject}
          htmlContent={htmlContent}
          onContentChange={handleContentChange}
          readOnly={isViewMode}
          onSave={handleSave}
          onSend={handleSaveAndSend}
          onDelete={handleDelete}
          onCancel={handleCancel}
          saveButtonLoading={updateEmailBlast.isPending}
          sendButtonLoading={sendEmailBlast.isPending}
          sendButtonDisabled={isViewMode}
          sendButtonText={
            blast?.status === "SENT" ? "Already Sent" : "Save & Send"
          }
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
      <EmailBlastEditorContent />
    </WithLocalNavigationHeader>
  );
}
