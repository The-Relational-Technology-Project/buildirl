import { LongTextSchema, User } from "~/server/service/types";
import { api } from "~/trpc/react";
import { useForm } from "@mantine/form";
import { safeValidateSchema } from "~/utils/zod";
import { QueryError } from "~/client/utils/QueryError";
import { isLoaded } from "~/client/utils";
import EditableUserAvatar from "~/client/components/EditableUserAvatar";
import React from "react";
import { Button, Flex, Stack, Text, Textarea, Title } from "@mantine/core";

type UserFormProps = {
  user: User;
};

function UpdateUserForm({ user }: UserFormProps) {
  const utils = api.useUtils();
  const updateUser = api.main.updateUser.useMutation({
    onSuccess: async () => {
      await utils.main.user.invalidate();
      await utils.main.userById.invalidate({ id: user.id });
    }
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
      <Stack w={{ base: undefined, md: 400 }}>
        <Title order={6} mt={8}>
          Name
        </Title>
        <Text>{`${user.firstName} ${user.lastName}`}</Text>
        <Title order={6} mt={8}>
          Bio
        </Title>
        <Textarea
          placeholder={
            "Share a little about who you are and how you will add to the community!"
          }
          key={form.key("description")}
          {...form.getInputProps("description")}
          autosize
          minRows={3}
        />
        <Button
          type="submit"
          w={100}
          mt={"sm"}
          disabled={!form.isValid()}
          loading={updateUser.isPending}
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
      <Stack mt={"lg"} gap={4}>
        <Title order={4}>Your Profile</Title>
        <Text size={"md"}>Choose how you are displayed to other members.</Text>
        <Flex justify={"flex-start"} direction={"row"} gap={"xl"}>
          <UpdateUserForm user={r.data!} />
          <Stack gap={"xs"}>
            <Title order={6}>Profile Picture</Title>
            <EditableUserAvatar size={120} user={r.data!} />
          </Stack>
        </Flex>
      </Stack>
    )
  );
}
