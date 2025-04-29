import { LongTextSchema, User } from "~/server/service/types";
import { api } from "~/trpc/react";
import { useForm } from "@mantine/form";
import { safeValidateSchema } from "~/utils/zod";
import { QueryError } from "~/client/utils/QueryError";
import { isLoaded } from "~/client/utils";
import EditableUserAvatar from "~/client/components/EditableUserAvatar";
import React from "react";
import { Button, Stack, Text, Textarea, Title } from "@mantine/core";
import { handleDefaultMutationError } from "~/client/logger";

type UserFormProps = {
  user: User;
};

function UpdateUserForm({ user }: UserFormProps) {
  const utils = api.useUtils();
  const updateUser = api.main.updateUser.useMutation({
    onSuccess: async () => {
      await utils.main.user.invalidate();
      await utils.main.userById.invalidate({ id: user.id });
    },
    onError: handleDefaultMutationError
  });

  const form = useForm({
    initialValues: {
      description: user.description
    },
    validateInputOnChange: true,
    validate: {
      description: (v) => safeValidateSchema(LongTextSchema, v)
    }
  });

  return (
    <form
      onSubmit={form.onSubmit(async ({ description }) => {
        await updateUser.mutateAsync({ id: user.id, input: { description } });
      })}
    >
      <Stack w="100%" miw={{ base: 300, md: 400 }} gap="md">
        <Stack gap={2}>
          <Title order={6}>Name</Title>
          <Text>{`${user.firstName} ${user.lastName}`}</Text>
        </Stack>

        <Textarea
          placeholder={
            "Share a little about who you are and how you will add to the community!"
          }
          key={form.key("description")}
          {...form.getInputProps("description")}
          autosize
          minRows={3}
          maxRows={8}
          w="100%"
        />

        <Button
          type="submit"
          w={100}
          mt="sm"
          disabled={!form.isValid()}
          loading={updateUser.isPending}
          style={{ alignSelf: "center" }}
        >
          Save
        </Button>
      </Stack>
    </form>
  );
}

export default function EditProfilePanel() {
  const r = api.main.user.useQuery();

  QueryError.check({
    result: r,
    fieldName: "user"
  });

  return (
    isLoaded(r) && (
      <Stack mt="lg" gap="md" w="100%" maw={800} mx="auto">
        <Stack align="center" gap="md">
          <EditableUserAvatar size={120} user={r.data!} />
          <Stack gap={2} align="center">
            <Title order={4}>Your Profile</Title>
            <Text size="md">
              Choose how you are displayed to other members.
            </Text>
          </Stack>
        </Stack>

        <UpdateUserForm user={r.data!} />
      </Stack>
    )
  );
}
