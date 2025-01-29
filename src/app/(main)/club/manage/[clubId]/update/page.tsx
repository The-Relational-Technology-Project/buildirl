"use client";

import {
  Club,
  ClubNameSchema,
  ClubPublicIdSchema,
  ClubTagLineSchema,
  InstagramHandleSchema,
  LongTextSchema,
  URLSchema
} from "~/server/service/types";
import { api } from "~/trpc/react";
import { useForm } from "@mantine/form";
import { safeValidateSchema } from "~/utils/zod";
import {
  ActionIcon,
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
import { IconArrowLeft } from "@tabler/icons-react";
import { WithLocalNavigationHeader } from "~/client/components/WithLocalNavigationHeader";

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
      websiteURL: club.websiteURL,
      instagramHandle: club.instagramHandle,
      eventCalendarURL: club.eventCalendarURL
    },

    validateInputOnChange: true,

    validate: {
      description: (v) => safeValidateSchema(LongTextSchema, v),
      publicId: (v) => safeValidateSchema(ClubPublicIdSchema, v),
      name: (v) => safeValidateSchema(ClubNameSchema, v),
      tagLine: (v) => safeValidateSchema(ClubTagLineSchema, v),
      websiteURL: (v) => safeValidateSchema(URLSchema.nullable(), v),
      instagramHandle: (v) =>
        safeValidateSchema(InstagramHandleSchema.nullable(), v),
      eventCalendarURL: (v) => safeValidateSchema(URLSchema.nullable(), v)
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
          websiteURL,
          instagramHandle,
          eventCalendarURL
        }) => {
          await updateClub.mutateAsync({
            id: club.id,
            input: {
              publicId: publicId,
              name: name,
              tagLine: tagLine,
              description: description,
              websiteURL: websiteURL === "" ? null : websiteURL,
              instagramHandle: instagramHandle === "" ? null : instagramHandle,
              eventCalendarURL:
                eventCalendarURL === "" ? null : eventCalendarURL
            }
          });
        }
      )}
    >
      <Stack gap={16}>
        <EditableClubImage
          clubId={club.id}
          style={{
            alignSelf: "center",
            // necessary to not override
            // existing style
            position: "relative"
          }}
        />

        <Divider />

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
            rows={3}
          />
        </Stack>

        <Stack gap={8}>
          <Title order={6} mt={6}>
            Links
          </Title>
          <TextInput
            placeholder="Website link"
            value={form.values.websiteURL ?? ""}
            onChange={(event) =>
              form.setFieldValue("websiteURL", event.currentTarget.value)
            }
            error={form.errors.websiteURL}
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
            value={form.values.eventCalendarURL ?? ""}
            onChange={(event) =>
              form.setFieldValue("eventCalendarURL", event.currentTarget.value)
            }
            error={form.errors.eventCalendarURL}
          />
        </Stack>

        <Stack gap={8}>
          <Title order={6} mt={6}>
            Share link
          </Title>
          <Group gap={4}>
            <Text c={"dimmed"} size={"sm"}>
              buildirl.com/join/
            </Text>
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
  const clubId = parseInt(params.clubId);
  const router = useRouter();

  const r = api.main.club.useQuery({ id: clubId });

  QueryError.check({
    result: r,
    fieldName: "club"
  });

  return (
    isLoaded(r) && (
      <WithLocalNavigationHeader>
        <Stack px={200}>
          <UpdateClubForm club={r.data!} />
        </Stack>
      </WithLocalNavigationHeader>
    )
  );
}
