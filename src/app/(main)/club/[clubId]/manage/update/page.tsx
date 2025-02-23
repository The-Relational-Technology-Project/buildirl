"use client";

import {
  Club,
  ClubNameSchema,
  ClubPublicIdSchema,
  ClubTagLineSchema,
  InstagramHandleSchema,
  LongTextSchema,
  UrlSchema
} from "~/server/service/types";
import { api } from "~/trpc/react";
import { useForm } from "@mantine/form";
import { safeValidateSchema } from "~/utils/zod";
import {
  Button,
  Divider,
  Group,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title
} from "@mantine/core";
import EditableClubImage from "~/client/components/EditableClubImage";
import React from "react";
import { useParams, useRouter } from "next/navigation";
import { QueryError } from "~/client/utils/QueryError";
import { isLoaded } from "~/client/utils";
import WithLocalNavigationHeader from "~/client/components/WithLocalNavigationHeader";
import { strictParseInt } from "~/utils";
import ThemeSelector from "~/app/(main)/club/[clubId]/manage/update/_components/ThemeSelector";
import { TemplateThemeSchema } from "~/client/theme/templates";
import ClubImageUploader from "~/app/(main)/club/[clubId]/manage/update/_components/ClubDisplayImageUpload";

type UpdateClubFormProps = {
  club: Club;
};

function UpdateClubForm({ club }: UpdateClubFormProps) {
  const utils = api.useUtils();
  const router = useRouter();

  const updateClub = api.main.updateClub.useMutation({
    onSuccess: () => {
      utils.main.club.invalidate({ id: club.id });
      utils.main.clubByPublicId.invalidate({ publicId: club.publicId });
      utils.main.userOwnedClubs.invalidate();
      router.back();
    }
  });

  const form = useForm({
    initialValues: {
      publicId: club.publicId,
      name: club.name,
      tagLine: club.tagLine,
      description: club.description,
      websiteUrl: club.websiteUrl,
      instagramHandle: club.instagramHandle,
      eventCalendarUrl: club.eventCalendarUrl,
      theme: club.theme
    },

    validateInputOnChange: true,

    validate: {
      description: (v) => safeValidateSchema(LongTextSchema, v),
      publicId: (v) => safeValidateSchema(ClubPublicIdSchema, v),
      name: (v) => safeValidateSchema(ClubNameSchema, v),
      tagLine: (v) => safeValidateSchema(ClubTagLineSchema, v),
      websiteUrl: (v) => safeValidateSchema(UrlSchema.nullable(), v),
      instagramHandle: (v) =>
        safeValidateSchema(InstagramHandleSchema.nullable(), v),
      eventCalendarUrl: (v) => safeValidateSchema(UrlSchema.nullable(), v),
      theme: (v) => safeValidateSchema(TemplateThemeSchema.nullable(), v)
    }
  });

  return (
    <form
      onSubmit={form.onSubmit(
        async ({
          publicId,
          name,
          tagLine,
          description,
          websiteUrl,
          instagramHandle,
          eventCalendarUrl,
          theme
        }) => {
          await updateClub.mutateAsync({
            id: club.id,
            input: {
              publicId: publicId,
              name: name,
              tagLine: tagLine,
              description: description,
              websiteUrl: websiteUrl === "" ? null : websiteUrl,
              instagramHandle: instagramHandle === "" ? null : instagramHandle,
              eventCalendarUrl:
                eventCalendarUrl === "" ? null : eventCalendarUrl,
              theme: theme
            }
          });
        }
      )}
    >
      <Stack gap={16}>
        <EditableClubImage
          club={club}
          size={{ base: 180, md: 300 }}
          style={{
            alignSelf: "center",
            // necessary to not override
            // existing style
            position: "relative"
          }}
        />

        <Stack gap={8} mt={4}>
          <TextInput
            required
            placeholder="Club name"
            value={form.values.name}
            onChange={(event) =>
              form.setFieldValue("name", event.currentTarget.value)
            }
            error={form.errors.name}
          />
          <TextInput
            placeholder="Tag line"
            value={form.values.tagLine}
            onChange={(event) =>
              form.setFieldValue("tagLine", event.currentTarget.value)
            }
            error={form.errors.tagLine}
          />
          <Textarea
            placeholder="About your club"
            value={form.values.description}
            onChange={(event) =>
              form.setFieldValue("description", event.currentTarget.value)
            }
            error={form.errors.description}
            rows={6}
          />
        </Stack>

        <Stack gap={8} mt={6}>
          <Title order={6}>Links</Title>
          <TextInput
            placeholder="Website link"
            value={form.values.websiteUrl ?? ""}
            onChange={(event) =>
              form.setFieldValue("websiteUrl", event.currentTarget.value)
            }
            error={form.errors.websiteUrl}
          />
          <TextInput
            placeholder="Instagram tag"
            value={form.values.instagramHandle ?? ""}
            onChange={(event) =>
              form.setFieldValue("instagramHandle", event.currentTarget.value)
            }
            error={form.errors.instagramHandle}
          />
          <TextInput
            placeholder="Event calendar link (e.g., Luma)"
            value={form.values.eventCalendarUrl ?? ""}
            onChange={(event) =>
              form.setFieldValue("eventCalendarUrl", event.currentTarget.value)
            }
            error={form.errors.eventCalendarUrl}
          />
        </Stack>

        <Stack gap={8} mt={6}>
          <Title order={6}>Share link</Title>
          <Group gap={4} wrap={"nowrap"}>
            <Text size={"sm"}>buildirl.com/join/</Text>
            <TextInput
              required
              placeholder="club-tag"
              value={form.values.publicId}
              onChange={(event) =>
                form.setFieldValue("publicId", event.currentTarget.value)
              }
              error={form.errors.publicId}
            />
          </Group>
        </Stack>

        <Stack gap={8} mt={6}>
          <Title order={6}>Theme</Title>
          <ThemeSelector
            value={form.values.theme}
            onChange={(theme) => form.setFieldValue("theme", theme)}
            mt={4}
          />
        </Stack>

        <Stack gap={8} mt={6}>
          <Title order={6}>Showcase Images</Title>
          <ClubImageUploader club={club} />
        </Stack>

        <Button
          type="submit"
          w={100}
          mt={"md"}
          style={{ alignSelf: "center" }}
          disabled={!form.isValid()}
          loading={updateClub.isPending}
        >
          Save
        </Button>
      </Stack>
    </form>
  );
}

export default function UpdateClub() {
  const params = useParams<{ clubId: string }>();
  const clubId = strictParseInt(params.clubId);

  const r = api.main.club.useQuery({ id: clubId });

  QueryError.check({
    result: r,
    fieldName: "club"
  });

  return (
    isLoaded(r) && (
      <WithLocalNavigationHeader>
        <Stack px={{ base: 20, sm: 150 }} mb={"md"}>
          <UpdateClubForm club={r.data!} />
        </Stack>
      </WithLocalNavigationHeader>
    )
  );
}
