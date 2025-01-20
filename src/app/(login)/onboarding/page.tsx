"use client";

import {
  Button,
  Center,
  Paper,
  Stack,
  StackProps,
  Text,
  TextInput
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { safeValidateSchema } from "~/utils/zod";
import { FirstNameSchema, LastNameSchema } from "~/server/service/types";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";

function UserForm(props: StackProps) {
  const router = useRouter();
  const createUser = api.main.createUser.useMutation({
    onSuccess: () => {
      router.push("/");
    }
  });

  const form = useForm({
    initialValues: {
      firstName: "",
      lastName: ""
    },

    validate: {
      firstName: (v) => safeValidateSchema(FirstNameSchema, v),
      lastName: (v) => safeValidateSchema(LastNameSchema, v)
    }
  });

  const handleSubmit = async (values: {
    firstName: string;
    lastName: string;
  }) => {
    await createUser.mutateAsync({
      firstName: values.firstName,
      lastName: values.lastName,
      // default empty
      description: ""
    });
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack {...props}>
        <TextInput
          required
          placeholder="First name"
          value={form.values.firstName}
          onChange={(event) =>
            form.setFieldValue("firstName", event.currentTarget.value)
          }
          error={form.errors.email && "Invalid name"}
          radius="md"
        />
        <TextInput
          required
          placeholder="Last name"
          value={form.values.lastName}
          onChange={(event) =>
            form.setFieldValue("lastName", event.currentTarget.value)
          }
          error={form.errors.email && "Invalid name"}
          radius="md"
        />
        <Button
          type="submit"
          radius="xl"
          mt="sm"
          style={{ alignSelf: "center" }}
          loading={createUser.isPending}
        >
          {"Finish"}
        </Button>
      </Stack>
    </form>
  );
}

export default function Onboarding() {
  return (
    <Center h={"100vh"} pb={200}>
      <Paper radius="md" p="xl" withBorder w={300}>
        <Text size={"lg"} fw={500}>
          Welcome
        </Text>
        <Text size={"md"} fw={300} mt={"xs"}>
          Tell us more about yourself.
        </Text>
        <UserForm mt="md" />
      </Paper>
    </Center>
  );
}
