import { z } from "zod";

export const TemplateThemeSchema = z.object({
  headingFontFamily: z.string().min(3, "Length must be >= 3"),
  backgroundFileName: z.string().min(3, "Length must be >= 3"),
  isDark: z.boolean()
});
export type TemplateTheme = z.infer<typeof TemplateThemeSchema>;

const WHITE_FLOWER: TemplateTheme = {
  headingFontFamily: "Brush Script MT, cursive",
  backgroundFileName: "white-flower.jpg",
  isDark: false
};

const PURPLE_SWIRL: TemplateTheme = {
  headingFontFamily: "Georgia, serif",
  backgroundFileName: "purple-swirl.jpg",
  isDark: true
};

export const TEMPLATE_THEME_SELECTION = {
  "White Flower": WHITE_FLOWER,
  "Purple Swirl": PURPLE_SWIRL
};
