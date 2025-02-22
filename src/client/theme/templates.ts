import { z } from "zod";

export const TemplateThemeSchema = z.object({
  headingFontFamily: z.string().min(3, "Length must be >= 3"),
  backgroundFileName: z.string().min(3, "Length must be >= 3"),
  isDark: z.boolean()
});
export type TemplateTheme = z.infer<typeof TemplateThemeSchema>;

export const TEMPLATE_THEME_SELECTION = {
  Flora: {
    headingFontFamily: "Moon Dance",
    backgroundFileName: "flora.jpg",
    isDark: false
  },
  Seren: {
    headingFontFamily: "Funnel Display",
    backgroundFileName: "seren.jpg",
    isDark: true
  }
};
