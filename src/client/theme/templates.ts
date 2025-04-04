import { z } from "zod";

// theme

export const TemplateThemeSchema = z.object({
  backgroundFileName: z.string().min(3, "Length must be >= 3"),
  isDark: z.boolean()
});
export type TemplateTheme = z.infer<typeof TemplateThemeSchema>;

export const TEMPLATE_THEME_SELECTION = {
  Flora: {
    backgroundFileName: "flora.jpg",
    isDark: false
  },
  Seren: {
    backgroundFileName: "seren.jpg",
    isDark: true
  }
};

// themeHeadingFont

export const FONT_SELECTION: string[] = [
  "Default",
  "Funnel Display",
  "Moon Dance"
];
