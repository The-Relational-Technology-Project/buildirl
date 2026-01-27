import {
  Button,
  ButtonProps,
  useMantineColorScheme,
  useMantineTheme
} from "@mantine/core";
import React from "react";
import { IconArrowUpRight } from "@tabler/icons-react";
import { useMounted } from "@mantine/hooks";
import {
  darkenHexColor,
  getReadableTextColor,
  resolveAccentColor
} from "~/client/utils/color";

type PrimaryButtonProps = {
  children: React.ReactNode;
  includeIcon?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  type?: "submit" | "reset" | "button";
  fontFamily?: string;
  accentColor?: string | null;
};

const BASE_SHADOW_OFFSET = "6px 6px 0px";
const PRESSED_SHADOW_OFFSET = "2px 2px 0px";
const DARK_BASE_SHADOW_OFFSET = "8px 8px 0px";
const DARK_PRESSED_SHADOW_OFFSET = "3px 3px 0px";
const BASE_SHADOW_COLOR = "#000";
const DARK_SHADOW_COLOR = "#a86f00";
const BASE_TRANSLATE = "translate(0, 0)";
const PRESSED_TRANSLATE = "translate(4px, 4px)";

export default function PrimaryButton({
  children,
  // default no-op
  onClick = () => {},
  includeIcon = false,
  type,
  fontFamily,
  accentColor,
  ...props
}: PrimaryButtonProps & ButtonProps) {
  const mounted = useMounted();
  const { colorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();
  const isDark = colorScheme === "dark";
  const shouldUseAccent = accentColor !== undefined;
  const resolvedAccentColor = shouldUseAccent
    ? resolveAccentColor(accentColor)
    : null;
  const accentShadowColor = resolvedAccentColor
    ? darkenHexColor(resolvedAccentColor, 0.28)
    : null;
  const accentPressedShadowColor = resolvedAccentColor
    ? darkenHexColor(resolvedAccentColor, 0.38)
    : null;
  const borderColor = isDark ? theme.other.dark.ink : "#0d0d0d";
  const buildShadow = (offset: string, color: string) =>
    `${offset} ${color}, ${offset} 2px ${borderColor}`;
  const baseShadow = shouldUseAccent
    ? buildShadow(BASE_SHADOW_OFFSET, accentShadowColor ?? BASE_SHADOW_COLOR)
    : isDark
      ? buildShadow(DARK_BASE_SHADOW_OFFSET, DARK_SHADOW_COLOR)
      : buildShadow(BASE_SHADOW_OFFSET, BASE_SHADOW_COLOR);
  const pressedShadow = shouldUseAccent
    ? buildShadow(PRESSED_SHADOW_OFFSET, accentPressedShadowColor ?? BASE_SHADOW_COLOR)
    : isDark
      ? buildShadow(DARK_PRESSED_SHADOW_OFFSET, DARK_SHADOW_COLOR)
      : buildShadow(PRESSED_SHADOW_OFFSET, BASE_SHADOW_COLOR);
  const buttonBackground = resolvedAccentColor ?? "#ffe680";
  const buttonTextColor = resolvedAccentColor
    ? getReadableTextColor(resolvedAccentColor)
    : "#0d0d0d";

  const applyPressedStyle = (target: HTMLButtonElement) => {
    target.style.transform = PRESSED_TRANSLATE;
    target.style.boxShadow = pressedShadow;
  };

  const resetPressedStyle = (target: HTMLButtonElement) => {
    target.style.transform = BASE_TRANSLATE;
    target.style.boxShadow = baseShadow;
  };

  return (
    mounted && (
      <Button
        type={type}
        variant={"filled"}
        onClick={onClick}
        rightSection={includeIcon && <IconArrowUpRight />}
        size={"xl"}
        fz={{ base: "lg", md: "xl" }}
        w={{ base: 300, md: 400 }}
        onMouseDown={(event) => {
          applyPressedStyle(event.currentTarget);
        }}
        onMouseUp={(event) => {
          resetPressedStyle(event.currentTarget);
        }}
        onMouseLeave={(event) => {
          resetPressedStyle(event.currentTarget);
        }}
        onTouchStart={(event) => {
          applyPressedStyle(event.currentTarget);
        }}
        onTouchEnd={(event) => {
          resetPressedStyle(event.currentTarget);
        }}
        styles={{
          root: {
            backgroundColor: buttonBackground,
            color: buttonTextColor,
            border: `2px solid ${borderColor}`,
            boxShadow: baseShadow,
            borderRadius: 9999,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            fontWeight: 700,
            fontFamily: fontFamily ?? undefined,
            transition: "transform 0.1s ease, box-shadow 0.1s ease",
            "&:hover": {
              backgroundColor: buttonBackground
            },
            "&:active": {
              transform: PRESSED_TRANSLATE,
              boxShadow: pressedShadow
            },
            "&:disabled": {
              opacity: 0.6,
              cursor: "not-allowed"
            }
          }
        }}
        {...props}
      >
        {children}
      </Button>
    )
  );
}
