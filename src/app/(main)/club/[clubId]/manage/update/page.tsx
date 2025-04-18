"use client";

import {
  Club,
  ClubNameSchema,
  ClubTagLineSchema,
  LongTextSchema,
  UrlSchema,
  ClubPublicIdSchema,
  InstagramHandleSchema,
  FAQsSchema
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
import { ClubFormValues } from "./form-context";
import { useForm, FormProvider, useFormContext } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// Basic Information section component
function BasicInfoSection() {
  const { register } = useFormContext<ClubFormValues>();
  
  return (
    <Stack gap={8} mt={4}>
      <TextInput
        required
        placeholder="Club name"
        {...register("name")}
      />
      <TextInput
        placeholder="Tag line"
        {...register("tagLine")}
      />
      <Textarea
        placeholder="About your club"
        {...register("description")}
        rows={6}
      />
    </Stack>
  );
}

// Links section component
function LinksSection() {
  const { register } = useFormContext<ClubFormValues>();
  
  return (
    <Stack gap={8} mt={6}>
      <Title order={6}>Links</Title>
      <TextInput
        placeholder="Website link"
        {...register("websiteUrl")}
      />
      <TextInput
        placeholder="Instagram tag"
        {...register("instagramHandle")}
      />
      <TextInput
        placeholder="Event calendar link (e.g., Luma)"
        {...register("eventCalendarUrl")}
      />
    </Stack>
  );
}

// Share link section component
function ShareLinkSection() {
  const { register } = useFormContext<ClubFormValues>();
  
  return (
    <Stack gap={8} mt={6}>
      <Title order={6}>Share link</Title>
      <Group gap={4} wrap={"nowrap"}>
        <Text size={"sm"}>clubs.buildirl.com/join/</Text>
        <TextInput
          required
          placeholder="club-tag"
          {...register("publicId")}
        />
      </Group>
    </Stack>
  );
}

// Theme section component
function ThemeSection() {
  const { watch, setValue } = useFormContext<ClubFormValues>();
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

// Font section component
function FontSection() {
  const { watch, setValue } = useFormContext<ClubFormValues>();
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
  
  // Create the validation schema - Final version with fixes
  const validationSchema = z.object({
    publicId: ClubPublicIdSchema,
    name: ClubNameSchema,
    tagLine: ClubTagLineSchema,
    description: LongTextSchema,
    websiteUrl: z.union([z.literal(""), UrlSchema]).nullable().transform(v => v === null ? "" : v),
    instagramHandle: z.union([z.literal(""), InstagramHandleSchema]).nullable().transform(v => v === null ? "" : v),
    eventCalendarUrl: z.union([z.literal(""), UrlSchema]).nullable().transform(v => v === null ? "" : v),
    theme: TemplateThemeSchema.nullable(),
    themeHeadingFont: z.string().nullable(),
    faqs: FAQsSchema
  });
  
  // Create form with react-hook-form
  const methods = useForm<ClubFormValues>({
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

  const updateClub = api.main.updateClub.useMutation();
  
  const onSubmit = async (values: ClubFormValues) => {
    // Make a copy and transform empty strings to null for server validation
    const cleanedValues = {
      ...values,
      websiteUrl: values.websiteUrl === "" ? null : values.websiteUrl,
      instagramHandle: values.instagramHandle === "" ? null : values.instagramHandle,
      eventCalendarUrl: values.eventCalendarUrl === "" ? null : values.eventCalendarUrl,
      faqs: {
        items: values.faqs.items.map(({ question, answer }) => ({ 
          question, 
          answer 
        }))
      }
    };

    // Re-enable the mutation call
    try {
      await updateClub.mutateAsync({
        id: club.id,
        input: cleanedValues
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
          <ImagesSection club={club} />
          
          <Divider my="lg" />
          
          <div>
            <FAQSection />
          </div>
          
          <Box mt={32} style={{ display: 'flex', justifyContent: 'center' }}>
            <Button
              w={100}
              type="submit"
              disabled={updateClub.isPending} // Re-enabled
              loading={updateClub.isPending} // Re-enabled
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
