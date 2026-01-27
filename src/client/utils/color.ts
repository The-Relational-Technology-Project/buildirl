const HEX_COLOR_REGEX = /^#(?:[0-9a-fA-F]{3}){1,2}$/;

const clampChannel = (value: number) => Math.max(0, Math.min(255, value));

const expandHex = (value: string) => {
  if (value.length === 4) {
    const [hash, r, g, b] = value;
    return `${hash}${r}${r}${g}${g}${b}${b}`;
  }
  return value;
};

const hexToRgb = (hex: string) => {
  const normalized = expandHex(hex);
  const parsed = Number.parseInt(normalized.slice(1), 16);
  return {
    r: (parsed >> 16) & 255,
    g: (parsed >> 8) & 255,
    b: parsed & 255
  };
};

const rgbToHex = (r: number, g: number, b: number) =>
  `#${[r, g, b]
    .map((channel) => clampChannel(channel).toString(16).padStart(2, "0"))
    .join("")}`;

const normalizeHexColor = (value?: string | null) => {
  if (!value) return null;
  if (!HEX_COLOR_REGEX.test(value)) return null;
  return expandHex(value).toLowerCase();
};

export const DEFAULT_ACCENT_COLOR = "#fae06e";

export const resolveAccentColor = (
  value?: string | null,
  fallback: string = DEFAULT_ACCENT_COLOR
) =>
  normalizeHexColor(value) ??
  normalizeHexColor(fallback) ??
  DEFAULT_ACCENT_COLOR;

export const getRelativeLuminance = (hex: string) => {
  const { r, g, b } = hexToRgb(resolveAccentColor(hex));
  const [rs, gs, bs] = [r, g, b].map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : Math.pow((normalized + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
};

export const isColorDark = (hex: string) => getRelativeLuminance(hex) < 0.5;

export const getReadableTextColor = (
  hex: string,
  options?: { light?: string; dark?: string }
) => {
  const lightText = options?.light ?? "#ffffff";
  const darkText = options?.dark ?? "#0d0d0d";
  return isColorDark(hex) ? lightText : darkText;
};

const adjustHexColor = (hex: string, amount: number) => {
  const clampedAmount = Math.max(0, Math.min(1, amount));
  const { r, g, b } = hexToRgb(resolveAccentColor(hex));
  const adjustChannel = (channel: number) =>
    Math.round(channel + (255 - channel) * clampedAmount);
  return rgbToHex(adjustChannel(r), adjustChannel(g), adjustChannel(b));
};

const darkenHexColor = (hex: string, amount: number) => {
  const clampedAmount = Math.max(0, Math.min(1, amount));
  const { r, g, b } = hexToRgb(resolveAccentColor(hex));
  const adjustChannel = (channel: number) =>
    Math.round(channel * (1 - clampedAmount));
  return rgbToHex(adjustChannel(r), adjustChannel(g), adjustChannel(b));
};

export { adjustHexColor as lightenHexColor, darkenHexColor };
