import {
  Box,
  Button,
  Stack,
  Title,
  Text,
  useMantineColorScheme,
  useMantineTheme
} from "@mantine/core";
import { Club } from "~/server/club/types";
import { getRhythmString } from "../utils";
import {
  darkenHexColor,
  getReadableTextColor,
  isColorDark,
  resolveAccentColor
} from "~/client/utils/color";

type HowWeHangProps = {
  club: Club;
};

export function HowWeHang({ club }: HowWeHangProps) {
  const { colorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();
  const isDark = colorScheme === "dark";
  const borderRadius = 15;
  const accentColor = resolveAccentColor(club.accentColor);
  const accentIsDark = isColorDark(accentColor);
  const accentTextColor = getReadableTextColor(accentColor);
  const accentShadowColor = darkenHexColor(accentColor, 0.22);
  const accentGradientTop = darkenHexColor(
    accentColor,
    accentIsDark ? 0.08 : 0.18
  );
  const accentGradientBottom = darkenHexColor(
    accentColor,
    accentIsDark ? 0.36 : 0.14
  );
  const sectionTextColor = theme.other.dark.text;
  const sectionBorder = isDark
    ? `1px solid ${theme.other.dark.borderStrong}`
    : "2px solid #000";
  const sectionShadow = isDark
    ? `6px 6px 0px ${theme.other.dark.shadow}`
    : "6px 6px 0px #000";
  const upcomingButtonBackground = isDark
    ? `linear-gradient(180deg, ${accentGradientTop} 0%, ${accentColor} 52%, ${accentGradientBottom} 100%)`
    : accentColor;
  const upcomingButtonTextColor = accentTextColor;
  const upcomingButtonBorder = isDark
    ? `2px solid ${theme.other.dark.ink}`
    : "2px solid #000";
  const upcomingButtonShadowColor = accentShadowColor;
  const upcomingButtonShadowBorder = isDark
    ? `2px solid ${theme.other.dark.ink}`
    : "2px solid #000";
  const upcomingButtonInsetShadow = isDark
    ? "0 1px 0 rgba(0, 0, 0, 0.35) inset"
    : "0 1px 0 rgba(0, 0, 0, 0.08) inset";
  const rhythmLabel = club.rhythm ? getRhythmString(club.rhythm) : null;
  const howWeHangText = club.howWeHang?.trim() || null;
  const baseTranslate = "translate(0, 0)";
  const pressedTranslate = "translate(6px, 6px)";

  const applyPressedStyle = (target: HTMLButtonElement) => {
    target.style.transform = pressedTranslate;
  };

  const resetPressedStyle = (target: HTMLButtonElement) => {
    target.style.transform = baseTranslate;
  };

  if (!rhythmLabel && !club.eventCalendarUrl && !howWeHangText) {
    return null;
  }

  return (
    <Stack
      w="100%"
      ta="center"
      align="center"
      style={{
        backgroundColor: isDark ? theme.other.dark.surface : theme.colors.beige![1],
        border: sectionBorder,
        borderRadius,
        boxShadow: sectionShadow,
        color: isDark ? sectionTextColor : undefined,
        padding: "32px 24px"
      }}
      gap="md"
    >
      <Title
        order={2}
        mb={"xs"}
        tt="uppercase"
        ta="center"
        style={{
          fontFamily: club.themeHeadingFont ?? "inherit"
        }}
      >
        How We Hang
      </Title>
      {rhythmLabel && (
        <Box
          style={{
            backgroundColor: accentColor,
            border: "2px solid #000",
            borderRadius: 6,
            padding: "8px 20px",
            display: "inline-block",
            maxWidth: "100%"
          }}
        >
          <Text
            size="sm"
            fw={700}
            c={accentTextColor}
            style={{ letterSpacing: "0.04em" }}
          >
            {rhythmLabel}
          </Text>
        </Box>
      )}
      {howWeHangText && (
        <Text size="sm" ta="center" style={{ maxWidth: 520 }}>
          {howWeHangText}
        </Text>
      )}
      {club.eventCalendarUrl && (
        <Box style={{ position: "relative", display: "inline-block" }} mt="sm">
          <Box
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: upcomingButtonShadowColor,
              border: upcomingButtonShadowBorder,
              borderRadius: 999,
              transform: "translate(6px, 6px)",
              pointerEvents: "none"
            }}
          />
          <Button
            variant="filled"
            onClick={() => window.open(club.eventCalendarUrl!)}
            fz="lg"
            onMouseDown={(event) => applyPressedStyle(event.currentTarget)}
            onMouseUp={(event) => resetPressedStyle(event.currentTarget)}
            onMouseLeave={(event) => resetPressedStyle(event.currentTarget)}
            onTouchStart={(event) => applyPressedStyle(event.currentTarget)}
            onTouchEnd={(event) => resetPressedStyle(event.currentTarget)}
            style={{
              position: "relative",
              border: upcomingButtonBorder,
              borderRadius: 999,
              background: upcomingButtonBackground,
              padding: "16px 56px",
              height: "auto",
              minHeight: "unset",
              transform: baseTranslate,
              transition: "transform 0.12s ease",
              boxShadow: upcomingButtonInsetShadow,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              fontWeight: 700,
              fontFamily: club.themeHeadingFont ?? "inherit",
              color: upcomingButtonTextColor
            }}
          >
            Upcoming Events
          </Button>
        </Box>
      )}
    </Stack>
  );
}
