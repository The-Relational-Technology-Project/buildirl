"use client";

import {
  Club,
  ClubNameSchema,
  ClubTagLineSchema,
  LongTextSchema,
  UrlSchema,
  ClubPublicIdSchema,
  InstagramHandleSchema,
  FAQsSchema,
  FAQ
} from "~/server/service/types";
import { api } from "~/trpc/react";
import {
  Button,
  Group,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
  Box,
  Divider
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
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
import { z } from "zod";
import FontSelector from "~/app/(main)/club/[clubId]/manage/update/_components/FontSelector";
import FAQsFormSection from "~/app/(main)/club/[clubId]/manage/update/_components/FAQsFormSection";
import { IconDeviceFloppy } from "@tabler/icons-react";
import { useForm, FormProvider, useFormContext } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

function BasicInfoSection() {
  const { register } = useFormContext<Club>();

  return (
    <Stack gap={8} mt={4}>
      <TextInput required placeholder="Club name" {...register("name")} />
      <TextInput placeholder="Tag line" {...register("tagLine")} />
      <Textarea
        placeholder="About your club"
        {...register("description")}
        rows={6}
      />
    </Stack>
  );
}

function LinksSection() {
  const { register } = useFormContext<Club>();

  return (
    <Stack gap={8} mt={6}>
      <Title order={6}>Links</Title>
      <TextInput placeholder="Website link" {...register("websiteUrl")} />
      <TextInput placeholder="Instagram tag" {...register("instagramHandle")} />
      <TextInput
        placeholder="Event calendar link (e.g., Luma)"
        {...register("eventCalendarUrl")}
      />
    </Stack>
  );
}

function ShareLinkSection() {
  const { register } = useFormContext<Club>();

  return (
    <Stack gap={8} mt={6}>
      <Title order={6}>Share link</Title>
      <Group gap={4} wrap={"nowrap"}>
        <Text size={"sm"}>clubs.buildirl.com/join/</Text>
        <TextInput required placeholder="club-tag" {...register("publicId")} />
      </Group>
    </Stack>
  );
}

function ThemeSection() {
  const { watch, setValue } = useFormContext<Club>();
  const theme = watch("theme");

  return (
    <Stack gap={12} mt={6}>
      <Title order={6}>Background</Title>
      <ThemeSelector
        value={theme}
        onChange={(newTheme) => setValue("theme", newTheme)}
      />
    </Stack>
  );
}

function FontSection() {
  const { watch, setValue } = useFormContext<Club>();
  const font = watch("themeHeadingFont");

  return (
    <Stack gap={12} mt={6}>
      <Title order={6}>Font</Title>
      <FontSelector
        value={font}
        onChange={(newFont) => setValue("themeHeadingFont", newFont)}
      />
    </Stack>
  );
}

interface ShowcaseImagesSectionProps {
  club: Club;
}

function ShowcaseImagesSection({ club }: ShowcaseImagesSectionProps) {
  return (
    <Stack gap={8} mt={6}>
      <Title order={6}>Showcase Images</Title>
      <ClubImageUploader club={club} />
    </Stack>
  );
}

interface UpdateClubFormProps {
  club: Club;
}

function UpdateClubForm({ club }: UpdateClubFormProps) {
  const validationSchema = z.object({
    publicId: ClubPublicIdSchema,
    name: ClubNameSchema,
    tagLine: ClubTagLineSchema,
    description: LongTextSchema,
    websiteUrl: z
      .union([z.literal(""), UrlSchema])
      .nullable()
      .transform((v) => (v === null ? "" : v)),
    instagramHandle: z
      .union([z.literal(""), InstagramHandleSchema])
      .nullable()
      .transform((v) => (v === null ? "" : v)),
    eventCalendarUrl: z
      .union([z.literal(""), UrlSchema])
      .nullable()
      .transform((v) => (v === null ? "" : v)),
    theme: TemplateThemeSchema.nullable(),
    themeHeadingFont: z.string().nullable(),
    faqs: FAQsSchema
  });

  const methods = useForm<Club>({
    defaultValues: {
      publicId: club.publicId,
      name: club.name,
      tagLine: club.tagLine,
      description: club.description,
      websiteUrl: club.websiteUrl ?? "",
      instagramHandle: club.instagramHandle ?? "",
      eventCalendarUrl: club.eventCalendarUrl ?? "",
      theme: club.theme,
      themeHeadingFont: club.themeHeadingFont,
      faqs: club.faqs
    },
    resolver: zodResolver(validationSchema),
    mode: "onChange"
  });

  const utils = api.useUtils();
  const router = useRouter();

  // TODO we should use this variables pattern and extract out common mutations /
  //  invalidations for reuse
  const updateClub = api.main.updateClub.useMutation({
    onSuccess: (_, variables) => {
      utils.main.club.invalidate({ id: club.id });
      utils.main.clubByPublicId.invalidate({
        publicId: variables.input.publicId
      });
      utils.main.userOwnedClubs.invalidate();

      notifications.show({
        title: "Changes saved",
        message: "Your club has been updated successfully",
        color: "green"
      });

      router.push(`/club/${club.id}/manage`);
    },
    onError: (error) => {
      console.error("Error updating club:", error);
      notifications.show({
        title: "Error",
        message: "Failed to save changes. Please try again.",
        color: "red"
      });
    }
  });

  const onSubmit = (values: Club) => {
    updateClub.mutate({
      id: club.id,
      input: {
        ...values,
        // we need to coerce these to null to match server validation
        websiteUrl: values.websiteUrl === "" ? null : values.websiteUrl,
        instagramHandle:
          values.instagramHandle === "" ? null : values.instagramHandle,
        eventCalendarUrl:
          values.eventCalendarUrl === "" ? null : values.eventCalendarUrl,
        faqs: {
          items: values.faqs.items.map(({ question, answer }: FAQ) => ({
            question,
            answer
          }))
        }
      }
    });
  };

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={(e) => {
          return methods.handleSubmit(onSubmit)(e);
        }}
      >
        <Stack gap={16}>
          <EditableClubImage
            club={club}
            size={{ base: 180, md: 300 }}
            style={{
              alignSelf: "center",
              position: "relative"
            }}
          />

          <BasicInfoSection />
          <LinksSection />
          <ShareLinkSection />
          <ThemeSection />
          <FontSection />
          <ShowcaseImagesSection club={club} />

          <Divider my="lg" />
          <FAQsFormSection mt={6} />

          <Box mt={32} style={{ display: "flex", justifyContent: "center" }}>
            <Button
              w={100}
              type="submit"
              disabled={updateClub.isPending}
              loading={updateClub.isPending}
              leftSection={<IconDeviceFloppy size={16} />}
            >
              Save
            </Button>
          </Box>
        </Stack>
      </form>
    </FormProvider>
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
