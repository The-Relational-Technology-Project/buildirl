import { User } from "~/server/user/types";
import { 
  LongTextSchema, 
  UrlSchema,
  TwitterHandleSchema,
  InstagramHandleSchema,
  FacebookHandleSchema,
  LinkedInHandleSchema
} from "~/server/utils/types";
import { api } from "~/trpc/react";
import { useForm } from "@mantine/form";
import { safeValidateSchema } from "~/utils/zod";
import { QueryError } from "~/client/utils/QueryError";
import { isLoaded } from "~/client/utils";
import EditableUserAvatar from "~/client/components/EditableUserAvatar";
import PrefixedInput from "~/client/components/PrefixedInput";
import React from "react";
import { Button, Stack, Text, Textarea, Title, TextInput } from "@mantine/core";
import { handleDefaultMutationError, notifySuccess } from "~/client/logger";

type UserFormProps = {
  user: User;
};

function UpdateUserForm({ user }: UserFormProps) {
  const utils = api.useUtils();
  const updateUser = api.main.updateUser.useMutation({
    onSuccess: async (_, v) => {
      await utils.main.user.invalidate();
      await utils.main.userById.invalidate({ id: v.id });
    },
    onError: handleDefaultMutationError
  });

  const updateUserSocials = api.main.updateUserSocials.useMutation({
    onSuccess: async (_, v) => {
      await utils.main.user.invalidate();
      await utils.main.userById.invalidate({ id: v.id });
    },
    onError: handleDefaultMutationError
  });

  const form = useForm({
    initialValues: {
      description: user.description,
      twitter: user.socials?.twitter ?? null,
      instagram: user.socials?.instagram ?? null,
      facebook: user.socials?.facebook ?? null,
      linkedin: user.socials?.linkedin ?? null,
      website: user.socials?.website ?? null
    },
    validateInputOnChange: true,
    validate: {
      description: (v) => safeValidateSchema(LongTextSchema, v),
      twitter: (v) => v ? safeValidateSchema(TwitterHandleSchema, v) : null,
      instagram: (v) => v ? safeValidateSchema(InstagramHandleSchema, v) : null,
      facebook: (v) => v ? safeValidateSchema(FacebookHandleSchema, v) : null,
      linkedin: (v) => v ? safeValidateSchema(LinkedInHandleSchema, v) : null,
      website: (v) => v ? safeValidateSchema(UrlSchema, v) : null
    }
  });

  return (
    <form
      onSubmit={form.onSubmit(async ({ description, twitter, instagram, facebook, linkedin, website }) => {
        await updateUser.mutateAsync({ id: user.id, input: { description } });
        
        await updateUserSocials.mutateAsync({ 
          id: user.id, 
          input: { twitter, instagram, facebook, linkedin, website }
        });
        
        notifySuccess("Profile updated", "Your profile has been updated successfully!");
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

        <Stack gap="xs">
          <Title order={6}>Social Links</Title>          
          <PrefixedInput 
            prefix="twitter.com/"
            placeholder="username"
            key={form.key("twitter")}
            {...form.getInputProps("twitter")}
          />
          <PrefixedInput 
            prefix="instagram.com/"
            placeholder="username"
            key={form.key("instagram")}
            {...form.getInputProps("instagram")}
          />
          <PrefixedInput 
            prefix="facebook.com/"
            placeholder="username"
            key={form.key("facebook")}
            {...form.getInputProps("facebook")}
          />
          <PrefixedInput 
            prefix="linkedin.com/in/"
            placeholder="username"
            key={form.key("linkedin")}
            {...form.getInputProps("linkedin")}
          />
          <TextInput
            placeholder="https://yourwebsite.com"
            key={form.key("website")}
            {...form.getInputProps("website")}
          />
        </Stack>

        <Button
          type="submit"
          w={100}
          mt="sm"
          disabled={!form.isValid()}
          loading={updateUser.isPending || updateUserSocials.isPending}
          style={{ alignSelf: "center" }}
        >
          Save
        </Button>
      </Stack>
    </form>
  );
}

export default function EditProfilePanel() {
  const user = api.main.user.useQuery();

  QueryError.check({
    result: user,
    fieldName: "user"
  });

  return (
    isLoaded(user) && (
      <Stack mt="lg" gap="md" w="100%" maw={800} mx="auto">
        <Stack align="center" gap="md">
          <EditableUserAvatar size={120} user={user.data!} />
          <Stack gap={2} align="center">
            <Title order={4}>Your Profile</Title>
            <Text size="md">
              Choose how you are displayed to other members.
            </Text>
          </Stack>
        </Stack>

        <UpdateUserForm user={user.data!} />
      </Stack>
    )
  );
}
