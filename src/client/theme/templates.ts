import { z } from "zod";

// theme

export const TemplateThemeSchema = z.object({
  backgroundFileName: z.string().min(3, "Length must be >= 3"),
  isDark: z.boolean()
});
export type TemplateTheme = z.infer<typeof TemplateThemeSchema>;

export const TEMPLATE_THEME_SELECTION = {
  BlackPaint: {
    backgroundFileName: "black-paint.png",
    isDark: true
  },
  Black: {
    backgroundFileName: "black.png",
    isDark: true
  },
  BlueStars: {
    backgroundFileName: "blue-stars.png",
    isDark: true
  },
  GreenBlurDark: {
    backgroundFileName: "green-blur.png",
    isDark: true
  },
  OceanWave: {
    backgroundFileName: "ocean-wave.png",
    isDark: true
  },
  PinkCyanSwirl: {
    backgroundFileName: "pink-cyan-swirl.png",
    isDark: true
  },
  PurpleBlueSwirl: {
    backgroundFileName: "purple-blue-swirl.png",
    isDark: true
  },
  PurpleCurves: {
    backgroundFileName: "purple-curves.png",
    isDark: true
  },
  PurpleStars: {
    backgroundFileName: "purple-stars.png",
    isDark: true
  },
  RedBlueBlur: {
    backgroundFileName: "red-blue-blur.png",
    isDark: true
  },
  Sunrise: {
    backgroundFileName: "sunrise.png",
    isDark: true
  },
  BlueGreenBlur: {
    backgroundFileName: "blue-green-blur.png",
    isDark: false
  },
  BlueZebra: {
    backgroundFileName: "blue-zebra.png",
    isDark: false
  },
  Circus: {
    backgroundFileName: "circus.png",
    isDark: false
  },
  GreenBlurLight: {
    backgroundFileName: "green-blur.png",
    isDark: false
  },
  NostalgicClouds: {
    backgroundFileName: "nostalgic-clouds.png",
    isDark: false
  },
  PinkClouds: {
    backgroundFileName: "pink-clouds.png",
    isDark: false
  },
  PixelGrass: {
    backgroundFileName: "pixel-grass.png",
    isDark: false
  },
  PurpleYellowBlur: {
    backgroundFileName: "purple-yellow-blur.png",
    isDark: false
  },
  RainColor: {
    backgroundFileName: "rain-color.png",
    isDark: false
  },
  RuledPaper: {
    backgroundFileName: "ruled-paper.png",
    isDark: false
  },
  Shine: {
    backgroundFileName: "shine.png",
    isDark: false
  },
  Unicorn: {
    backgroundFileName: "unicorn.png",
    isDark: false
  },
  WaterColors: {
    backgroundFileName: "water-colors.png",
    isDark: false
  },
  YellowCurve: {
    backgroundFileName: "yellow-curve.png",
    isDark: false
  }
};

// themeHeadingFont

export const FONT_SELECTION: string[] = [
  "Calistoga",
  "Instrument Serif",
  "Montserrat",
  "Martian Mono",
  "Bagel Fat One",
  "Rozha One"
];
