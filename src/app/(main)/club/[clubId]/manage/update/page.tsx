"use client";

import {
  Club,
  ClubNameSchema,
  ClubPublicIdSchema,
  ClubTagLineSchema,
  InstagramHandleSchema,
  LongTextSchema,
  UrlSchema,
  FAQsSchema
} from "~/server/service/types";
import { api } from "~/trpc/react";
import { useForm } from "@mantine/form";
import { safeValidateSchema } from "~/utils/zod";
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
import { notifications } from '@mantine/notifications';
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
import FAQSection from "~/app/(main)/club/[clubId]/manage/update/_components/FAQSection";
import { IconDeviceFloppy } from "@tabler/icons-react";
import { ClubFormProvider, useClubFormContext, useClubForm, ClubFormValues } from "./form-context";

// Basic Information section component
interface BasicInfoSectionProps {
  club: Club;
}

function BasicInfoSection({ club }: BasicInfoSectionProps) {
  const form = useClubFormContext();
  
  return (
    <Stack gap={8} mt={4}>
      <TextInput
        required
        placeholder="Club name"
        key={form.key("name")}
        {...form.getInputProps("name")}
      />
      <TextInput
        placeholder="Tag line"
        key={form.key("tagLine")}
        {...form.getInputProps("tagLine")}
      />
      <Textarea
        placeholder="About your club"
        key={form.key("description")}
        {...form.getInputProps("description")}
        rows={6}
      />
    </Stack>
  );
}

// Links section component
interface LinksSectionProps {
  club: Club;
}

function LinksSection({ club }: LinksSectionProps) {
  const form = useClubFormContext();
  
  return (
    <Stack gap={8} mt={6}>
      <Title order={6}>Links</Title>
      <TextInput
        placeholder="Website link"
        key={form.key("websiteUrl")}
        {...form.getInputProps("websiteUrl")}
      />
      <TextInput
        placeholder="Instagram tag"
        key={form.key("instagramHandle")}
        {...form.getInputProps("instagramHandle")}
      />
      <TextInput
        placeholder="Event calendar link (e.g., Luma)"
        key={form.key("eventCalendarUrl")}
        {...form.getInputProps("eventCalendarUrl")}
      />
    </Stack>
  );
}

// Share link section component
interface ShareLinkSectionProps {
  club: Club;
}

function ShareLinkSection({ club }: ShareLinkSectionProps) {
  const form = useClubFormContext();
  
  return (
    <Stack gap={8} mt={6}>
      <Title order={6}>Share link</Title>
      <Group gap={4} wrap={"nowrap"}>
        <Text size={"sm"}>clubs.buildirl.com/join/</Text>
        <TextInput
          required
          placeholder="club-tag"
          key={form.key("publicId")}
          {...form.getInputProps("publicId")}
        />
      </Group>
    </Stack>
  );
}

// Theme section component
interface ThemeSectionProps {
  club: Club;
}

function ThemeSection({ club }: ThemeSectionProps) {
  const form = useClubFormContext();
  
  return (
    <Stack gap={12} mt={6}>
      <Title order={6}>Background</Title>
      <ThemeSelector
        value={form.values.theme}
        onChange={(theme) => form.setFieldValue("theme", theme)}
      />
    </Stack>
  );
}

// Font section component
interface FontSectionProps {
  club: Club;
}

function FontSection({ club }: FontSectionProps) {
  const form = useClubFormContext();
  
  return (
    <Stack gap={12} mt={6}>
      <Title order={6}>Font</Title>
      <FontSelector
        value={form.values.themeHeadingFont}
        onChange={(font) => form.setFieldValue("themeHeadingFont", font)}
      />
    </Stack>
  );
}

// Images section component
interface ImagesSectionProps {
  club: Club;
}

function ImagesSection({ club }: ImagesSectionProps) {
  return (
    <Stack gap={8} mt={6}>
      <Title order={6}>Showcase Images</Title>
      <ClubImageUploader club={club} />
    </Stack>
  );
}

// Main form component
interface UpdateClubFormProps {
  club: Club;
}

function UpdateClubForm({ club }: UpdateClubFormProps) {
  const utils = api.useUtils();
  const router = useRouter();
  
  // Create form with integrated FAQ state
  const form = useClubForm({
    initialValues: {
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
    validateInputOnChange: true,
    validate: {
      description: (v) => safeValidateSchema(LongTextSchema, v),
      publicId: (v) => safeValidateSchema(ClubPublicIdSchema, v),
      name: (v) => safeValidateSchema(ClubNameSchema, v),
      tagLine: (v) => safeValidateSchema(ClubTagLineSchema, v),
      websiteUrl: (v) =>
        safeValidateSchema(UrlSchema.nullable(), v === "" ? null : v),
      instagramHandle: (v) =>
        safeValidateSchema(
          InstagramHandleSchema.nullable(),
          v === "" ? null : v
        ),
      eventCalendarUrl: (v) =>
        safeValidateSchema(UrlSchema.nullable(), v === "" ? null : v),
      theme: (v) => safeValidateSchema(TemplateThemeSchema.nullable(), v),
      themeHeadingFont: (v) => safeValidateSchema(z.string().nullable(), v),
      faqs: (v) => safeValidateSchema(FAQsSchema, v)
    }
  });

  const updateClub = api.main.updateClub.useMutation();

  const handleSubmit = form.onSubmit((values: ClubFormValues) => {
    const saveChanges = async () => {
      try {
        // Now include faqs in the main update
        await updateClub.mutateAsync({
          id: club.id,
          input: {
            publicId: values.publicId,
            name: values.name,
            tagLine: values.tagLine,
            description: values.description,
            websiteUrl: values.websiteUrl === "" ? null : values.websiteUrl,
            instagramHandle: values.instagramHandle === "" ? null : values.instagramHandle,
            eventCalendarUrl: values.eventCalendarUrl === "" ? null : values.eventCalendarUrl,
            theme: values.theme,
            themeHeadingFont: values.themeHeadingFont,
            faqs: values.faqs // Include FAQs in the main update
          }
        });
        
        // Invalidate queries to refresh data
        utils.main.club.invalidate({ id: club.id });
        utils.main.clubByPublicId.invalidate({ publicId: values.publicId });
        utils.main.userOwnedClubs.invalidate();
        
        // Show success notification
        notifications.show({
          title: 'Changes saved',
          message: 'Your club has been updated successfully',
          color: 'green'
        });
        
        // Navigate back
        router.push(`/club/${club.id}/manage`);
      } catch (error) {
        console.error("Error updating club:", error);
        // Show error notification
        notifications.show({
          title: 'Error',
          message: 'Failed to save changes. Please try again.',
          color: 'red'
        });
      }
    };
    
    saveChanges();
  });

  return (
    <ClubFormProvider form={form}>
      <form onSubmit={handleSubmit}>
        <Stack gap={16}>
          <EditableClubImage
            club={club}
            size={{ base: 180, md: 300 }}
            style={{
              alignSelf: "center",
              position: "relative"
            }}
          />

          <BasicInfoSection club={club} />
          <LinksSection club={club} />
          <ShareLinkSection club={club} />
          <ThemeSection club={club} />
          <FontSection club={club} />
          <ImagesSection club={club} />
          
          <Divider my="lg" />
          
          {/* 
            Wrap FAQSection in a div to prevent nested form issues.
            This isolates the FAQSection's event handlers from the parent form,
            preventing accidental form submissions when interacting with FAQ buttons.
          */}
          <div>
            <FAQSection club={club} />
          </div>
          
          <Box mt={32} style={{ display: 'flex', justifyContent: 'center' }}>
            <Button
              w={100}
              type="submit"
              disabled={!form.isValid()}
              loading={updateClub.isPending}
              leftSection={<IconDeviceFloppy size={16} />}
            >
              Save
            </Button>
          </Box>
        </Stack>
      </form>
    </ClubFormProvider>
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
