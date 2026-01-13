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

type HowWeHangProps = {
  club: Club;
};

export function HowWeHang({ club }: HowWeHangProps) {
  const { colorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();
  const borderRadius = 15;
  const accentColor = "#f7b7b1";
  const rhythmLabel = club.rhythm ? getRhythmString(club.rhythm) : null;
  const baseTranslate = "translate(0, 0)";
  const pressedTranslate = "translate(6px, 6px)";

  const applyPressedStyle = (target: HTMLButtonElement) => {
    target.style.transform = pressedTranslate;
  };

  const resetPressedStyle = (target: HTMLButtonElement) => {
    target.style.transform = baseTranslate;
  };

  if (!rhythmLabel && !club.eventCalendarUrl) {
    return null;
  }

  return (
    <Stack
      w="100%"
      ta="center"
      align="center"
      style={{
        backgroundColor:
          colorScheme === "dark"
            ? theme.colors.dark![3]
            : theme.colors.beige![1],
        border: "2px solid #000",
        borderRadius,
        boxShadow: "6px 6px 0px #000",
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
          <Text size="sm" fw={700} style={{ letterSpacing: "0.04em" }}>
            {rhythmLabel}
          </Text>
        </Box>
      )}
      <Text size="sm" ta="center" style={{ maxWidth: 520 }}>
        Downtown Arts District at the empty studio. We often start out the
        meetings with a quick ice breaker. Most people tend to stay afterwards
        to go to Chinatown for late night dumplings.
      </Text>
      {club.eventCalendarUrl && (
        <Box style={{ position: "relative", display: "inline-block" }} mt="sm">
          <Box
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: accentColor,
              border: "2px solid #000",
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
              border: "2px solid #000",
              borderRadius: 999,
              backgroundColor: "#ffffff",
              padding: "16px 56px",
              height: "auto",
              minHeight: "unset",
              transform: baseTranslate,
              transition: "transform 0.12s ease",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              fontWeight: 700,
              color: "#000"
            }}
          >
            Upcoming Events
          </Button>
        </Box>
      )}
    </Stack>
  );
}
