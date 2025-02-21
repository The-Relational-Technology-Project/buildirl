"use client";

import { api } from "~/trpc/react";
import { QueryError } from "~/client/utils/QueryError";
import { isLoaded } from "~/client/utils";
import {
  Stack,
  Title,
  Text,
  Tabs,
  Textarea,
  Button,
  Flex,
  Divider
} from "@mantine/core";
import { LongTextSchema, User } from "~/server/service/types";
import { useForm } from "@mantine/form";
import React from "react";
import EditableUserAvatar from "~/client/components/EditableUserAvatar";
import { safeValidateSchema } from "~/utils/zod";

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
          defaultValue={form.values.description}
          onChange={(event) =>
            form.setFieldValue("description", event.currentTarget.value)
          }
          placeholder={
            "Share a little about who you are and how you will add to the community!"
          }
          error={form.errors.description}
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

function AccountPanel() {
  const r = api.main.user.useQuery();

  QueryError.check({
    result: r,
    fieldName: "user"
  });

  return (
    isLoaded(r) && (
      <Stack mt={"lg"} gap={4}>
        <Title order={4}>Your Profile</Title>
        <Text size={"md"} c={"dimmed"}>
          Choose how you are displayed to other members.
        </Text>
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

export default function Settings() {
  return (
    <Stack pt={"xl"}>
      <Title order={2}>Settings</Title>

      <Tabs defaultValue={"account"}>
        <Tabs.List>
          <Tabs.Tab value={"account"}>Account</Tabs.Tab>
          <Tabs.Tab value={"payment"}>Payment</Tabs.Tab>
        </Tabs.List>

        <Divider />

        <Tabs.Panel value={"account"}>
          <AccountPanel />
        </Tabs.Panel>
        <Tabs.Panel value={"payment"}>
          <></>
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}
