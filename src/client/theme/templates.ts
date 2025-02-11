import { z } from "zod";

export const TemplateThemeSchema = z.object({
  headingFontFamily: z.string().min(3, "Length must be >= 3"),
  backgroundName: z.string().min(3, "Length must be >= 3"),
  isDark: z.boolean()
});
export type TemplateTheme = z.infer<typeof TemplateThemeSchema>;

const WHITE_FLOWER: TemplateTheme = {
  headingFontFamily: "Brush Script MT, cursive",
  backgroundName: "white-flower.jpg",
  isDark: false
};

const PURPLE_SWIRL: TemplateTheme = {
  headingFontFamily: "Georgia, serif",
  backgroundName: "purple-swirl.jpg",
  isDark: true
};

export const TEMPLATE_THEME_SELECTION = [WHITE_FLOWER, PURPLE_SWIRL];
