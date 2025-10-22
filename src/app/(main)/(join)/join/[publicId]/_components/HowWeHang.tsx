import { Stack, Title, Text } from "@mantine/core";
import SecondaryButton from "~/client/components/SecondaryButton";
import { Club } from "~/server/club/types";
import InfoChip from "./InfoChip";
import { getRhythmDescription } from "../utils";
import { IconCalendar } from "@tabler/icons-react";

type HowWeHangProps = {
  club: Club;
};

export function HowWeHang({ club }: HowWeHangProps) {
  if (!club.rhythm?.startDate) {
    return;
  }

  return (
    <Stack
      w={"100%"}
      style={{
        border: "1.5px solid #000000",
        borderRadius: 4,
        padding: "16px",
        alignItems: "center"
      }}
      gap={12}
    >
      <Title
        order={2}
        tt="uppercase"
        ta="center"
        style={{
          fontFamily: "'Unbounded', sans-serif",
          letterSpacing: "0.5px"
        }}
      >
        How We Hang
      </Title>
      <Text size="sm" mb={{ base: "xs", md: "sm" }}>
        Join us for our next gathering. Check out our full event calendar.
      </Text>
      <InfoChip>
        <IconCalendar size={20}></IconCalendar>
        <Text size={"s"}>{getRhythmDescription(club.rhythm)}</Text>
      </InfoChip>
      {club.eventCalendarUrl && (
        <SecondaryButton
          includeIcon
          onClick={() => window.open(club.eventCalendarUrl!)}
          mt={"sm"}
        >
          Upcoming Events
        </SecondaryButton>
      )}
    </Stack>
  );
}
