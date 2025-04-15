"use client";

import {
  Club,
  ClubNameSchema,
  ClubPublicIdSchema,
  ClubTagLineSchema,
  InstagramHandleSchema,
  LongTextSchema,
  UrlSchema,
  FAQsSchema,
  FAQs,
  FAQQuestionSchema,
  FAQAnswerSchema,
  FAQ
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
  ActionIcon,
  Box,
  Divider,
  Paper
} from "@mantine/core";
import { notifications } from '@mantine/notifications';
import EditableClubImage from "~/client/components/EditableClubImage";
import React, { useState } from "react";
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
import { IconPlus, IconTrash, IconEdit, IconDeviceFloppy } from "@tabler/icons-react";

// Type for the form values
type ClubFormValues = {
  publicId: string;
  name: string;
  tagLine: string;
  description: string;
  websiteUrl: string;
  instagramHandle: string;
  eventCalendarUrl: string;
  theme: z.infer<typeof TemplateThemeSchema> | null;
  themeHeadingFont: string | null;
  faqs: FAQs;
  newFAQ: {
    question: string;
    answer: string;
  };
};

// Custom hook for managing FAQs
function useFAQManager(form: ReturnType<typeof useForm<ClubFormValues>>, clubId: number) {
  const [showNewFAQ, setShowNewFAQ] = useState(false);
  const [editingFAQIndex, setEditingFAQIndex] = useState<number | null>(null);
  const utils = api.useUtils();
  const updateFAQs = api.main.updateClubFAQs.useMutation({
    onSuccess: () => {
      utils.main.club.invalidate({ id: clubId });
    }
  });

  const handleAddFAQ = () => {
    form.setFieldValue("newFAQ", { question: "", answer: "" });
    setShowNewFAQ(true);
    setEditingFAQIndex(null);
  };
  
  const handleEditFAQ = (index: number) => {
    const faq = form.values.faqs.items[index];
    if (!faq) return;
    
    form.setFieldValue("newFAQ", {
      question: faq.question,
      answer: faq.answer
    });
    setShowNewFAQ(true);
    setEditingFAQIndex(index);
  };
  
  const handleSaveFAQ = async () => {
    if (!form.validateField('newFAQ.question').hasError && !form.validateField('newFAQ.answer').hasError) {
      const newFAQ = {
        question: form.values.newFAQ.question,
        answer: form.values.newFAQ.answer
      };
      
      const updatedItems = [...form.values.faqs.items];
      
      if (editingFAQIndex !== null) {
        updatedItems[editingFAQIndex] = newFAQ;
      } else {
        updatedItems.push(newFAQ);
      }
      
      const updatedFaqs = { items: updatedItems };
      
      // Update local form state
      form.setFieldValue("faqs", updatedFaqs);
      
      // Save to database immediately
      try {
        await updateFAQs.mutateAsync({
          clubId: clubId,
          input: { faqs: updatedFaqs }
        });
        
        notifications.show({
          title: 'FAQ Updated',
          message: editingFAQIndex !== null ? 'FAQ updated successfully' : 'FAQ added successfully',
          color: 'green'
        });
      } catch (error) {
        console.error("Failed to save FAQ:", error);
        notifications.show({
          title: 'Error',
          message: 'Failed to save FAQ. Please try again.',
          color: 'red'
        });
      }
      
      setShowNewFAQ(false);
      setEditingFAQIndex(null);
    }
  };
  
  const handleCancelFAQ = () => {
    setShowNewFAQ(false);
    setEditingFAQIndex(null);
  };
  
  const handleDeleteFAQ = async (index: number) => {
    // Use a simple confirm dialog for deletion
    if (window.confirm('Are you sure you want to delete this FAQ?')) {
      const updatedItems = [...form.values.faqs.items];
      updatedItems.splice(index, 1);
      const updatedFaqs = { items: updatedItems };
      
      // Update local form state
      form.setFieldValue("faqs", updatedFaqs);
      
      // Save to database immediately
      try {
        await updateFAQs.mutateAsync({
          clubId: clubId,
          input: { faqs: updatedFaqs }
        });
        
        notifications.show({
          title: 'FAQ Deleted',
          message: 'FAQ has been removed successfully',
          color: 'green'
        });
      } catch (error) {
        // Restore previous state on error
        form.setFieldValue("faqs", form.values.faqs);
        
        console.error("Failed to delete FAQ:", error);
        notifications.show({
          title: 'Error',
          message: 'Failed to delete FAQ. Please try again.',
          color: 'red'
        });
      }
    }
  };

  return {
    showNewFAQ,
    editingFAQIndex,
    handleAddFAQ,
    handleEditFAQ,
    handleSaveFAQ,
    handleCancelFAQ,
    handleDeleteFAQ,
    isUpdating: updateFAQs.isPending
  };
}

// Basic Information section component
interface BasicInfoSectionProps {
  club: Club;
  form: ReturnType<typeof useForm<ClubFormValues>>;
}

function BasicInfoSection({ club, form }: BasicInfoSectionProps) {
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
  form: ReturnType<typeof useForm<ClubFormValues>>;
}

function LinksSection({ club, form }: LinksSectionProps) {
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
  form: ReturnType<typeof useForm<ClubFormValues>>;
}

function ShareLinkSection({ club, form }: ShareLinkSectionProps) {
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

// FAQs section component
interface FAQSectionProps {
  club: Club;
  form: ReturnType<typeof useForm<ClubFormValues>>;
  faqManager: ReturnType<typeof useFAQManager>;
}

function FAQSection({ club, form, faqManager }: FAQSectionProps) {
  const { 
    showNewFAQ, 
    editingFAQIndex, 
    handleAddFAQ, 
    handleEditFAQ, 
    handleSaveFAQ, 
    handleCancelFAQ, 
    handleDeleteFAQ,
    isUpdating
  } = faqManager;

  return (
    <Stack gap={8} mt={6}>
      <Title order={6}>Frequently Asked Questions</Title>
      <Text size="sm">Add questions and answers that potential members might have about your club.</Text>
      
      {form.values.faqs.items.length === 0 ? (
        <Text c="dimmed" ta="center">No FAQs added yet</Text>
      ) : (
        <Stack gap="md">
          {form.values.faqs.items.map((faq: FAQ, index: number) => (
            <Paper key={index} p="md" withBorder shadow="xs">
              <Stack gap="xs">
                <Group justify="space-between" wrap="nowrap">
                  <Text fw={700} size="md">{faq.question}</Text>
                  <Group gap="xs">
                    <ActionIcon 
                      onClick={() => handleEditFAQ(index)}
                      size="sm"
                      loading={isUpdating}
                    >
                      <IconEdit size={16} />
                    </ActionIcon>
                    <ActionIcon 
                      onClick={() => handleDeleteFAQ(index)}
                      color="red" 
                      size="sm"
                      loading={isUpdating}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Group>
                </Group>
                <Text c="dimmed">{faq.answer}</Text>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}
      
      {showNewFAQ && (
        <Paper p="md" withBorder>
          <Stack>
            <TextInput
              label="Question"
              placeholder="What is your club about?"
              required
              {...form.getInputProps("newFAQ.question")}
            />
            <Textarea
              label="Answer"
              placeholder="Our club is about..."
              minRows={4}
              autosize
              maxRows={20}
              required
              {...form.getInputProps("newFAQ.answer")}
            />
            <Group justify="flex-end">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCancelFAQ}
              >
                Cancel
              </Button>
              <Button 
                type="button"
                onClick={handleSaveFAQ}
                loading={isUpdating}
              >
                {editingFAQIndex !== null ? "Update" : "Add"} FAQ
              </Button>
            </Group>
          </Stack>
        </Paper>
      )}
      
      {!showNewFAQ && (
        <Button 
          onClick={handleAddFAQ}
          variant="outline"
          disabled={isUpdating}
        >
          <IconPlus size={16} style={{ marginRight: 8 }} />
          Add FAQ
        </Button>
      )}
    </Stack>
  );
}

// Theme section component
interface ThemeSectionProps {
  club: Club;
  form: ReturnType<typeof useForm<ClubFormValues>>;
}

function ThemeSection({ club, form }: ThemeSectionProps) {
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
  form: ReturnType<typeof useForm<ClubFormValues>>;
}

function FontSection({ club, form }: FontSectionProps) {
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
  const form = useForm<ClubFormValues>({
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
      faqs: club.faqs,
      newFAQ: {
        question: "",
        answer: ""
      }
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
      faqs: (v) => safeValidateSchema(FAQsSchema, v),
      newFAQ: {
        question: (v) => safeValidateSchema(FAQQuestionSchema, v),
        answer: (v) => safeValidateSchema(FAQAnswerSchema, v)
      }
    }
  });

  const updateClub = api.main.updateClub.useMutation();
  
  // Initialize FAQ manager with the club ID
  const faqManager = useFAQManager(form, club.id);

  const handleSubmit = form.onSubmit((values: ClubFormValues) => {
    const saveChanges = async () => {
      try {
        // Only update the club details
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
            themeHeadingFont: values.themeHeadingFont
          }
        });
        
        // FAQs are now handled separately by the FAQManager
        
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

        <BasicInfoSection club={club} form={form} />
        <LinksSection club={club} form={form} />
        <ShareLinkSection club={club} form={form} />
        <ThemeSection club={club} form={form} />
        <FontSection club={club} form={form} />
        <ImagesSection club={club} />
        
        <Divider my="lg" />
        
        <FAQSection club={club} form={form} faqManager={faqManager} />
        
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
