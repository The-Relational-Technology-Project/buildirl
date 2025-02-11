export type TemplateTheme = {
  headingFontFamily: string;
  backgroundName: string;
  isDark: boolean;
};

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

export const TEMPLATE_SELECTION = [WHITE_FLOWER, PURPLE_SWIRL];
