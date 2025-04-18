import { z } from "zod";
import { TemplateThemeSchema } from "~/client/theme/templates";
import { FAQsSchema } from "~/server/service/types";

// Type for the form values
export type ClubFormValues = {
  publicId: string;
  name: string;
  tagLine: string;
  description: string;
  websiteUrl: string;
  instagramHandle: string;
  eventCalendarUrl: string;
  theme: z.infer<typeof TemplateThemeSchema> | null;
  themeHeadingFont: string | null;
  faqs: z.infer<typeof FAQsSchema>;
}; 