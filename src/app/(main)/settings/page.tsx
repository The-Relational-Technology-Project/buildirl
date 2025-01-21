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
  Group,
  Flex
} from "@mantine/core";
import { User } from "~/server/service/types";
import { useForm } from "@mantine/form";
import React from "react";
import EditableUserAvatar from "~/client/components/EditableUserAvatar";

type UserFormProps = {
  user: User;
};

function UserForm({ user }: UserFormProps) {
  const utils = api.useUtils();
  const updateUser = api.main.updateUser.useMutation({
    onSuccess: async () => {
      await utils.main.user.invalidate();
      await utils.main.userById.invalidate({ userId: user.id });
    }
  });

  const form = useForm({
    initialValues: {
      description: user.description
    },

    validate: {
      description: () => null
    }
  });

  return (
    <form
      onSubmit={form.onSubmit(async ({ description }) => {
        await updateUser.mutate({ id: user.id, input: { description } });
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
          autosize
          minRows={3}
        />
        <Button type="submit" w={100} mt={"sm"} disabled={updateUser.isPending}>
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
          <UserForm user={r.data!} />
          <EditableUserAvatar user={r.data!} ml={10} mt={10} />
        </Flex>
      </Stack>
    )
  );
}

export default function Settings() {
  return (
    <Stack pt={"xl"}>
      <Title order={2}>Settings</Title>

      <Tabs color={"gray"} radius={"xs"} defaultValue={"account"}>
        <Tabs.List>
          <Tabs.Tab value={"account"}>Account</Tabs.Tab>
          <Tabs.Tab value={"payment"}>Payment</Tabs.Tab>
        </Tabs.List>

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
