import {
  Box,
  Button,
  Card,
  Group,
  Stack,
  Text,
  Title,
  Image,
  Badge
} from "@mantine/core";
import { IconMapPin, IconCalendar } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import UserAvatar from "~/client/components/UserAvatar";
import { ClubWithFirstLead } from "~/server/club/types";
import { storageClient } from "~/client/utils/storageClient";

type DiscoverCardProps = {
  club: ClubWithFirstLead;
};

export default function DiscoverCard({ club }: DiscoverCardProps) {
  const router = useRouter();
  const firstLead = club.firstLead;

  return (
    <Card
      shadow="sm"
      padding="lg"
      radius="md"
      withBorder
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        cursor: "pointer"
      }}
    >
      <Stack gap="md" style={{ flex: 1 }}>
        <Title order={4} lineClamp={1} ta="center">
          {club.name}
        </Title>

        {club.tagLine && (
          <Text size="sm" c="dimmed" lineClamp={2} ta="center">
            {club.tagLine}
          </Text>
        )}

        <Box style={{ display: "flex", justifyContent: "center" }}>
          <Image
            src={storageClient.clubProfileImageUrl(club.id)}
            fallbackSrc="/images/good-club.png"
            width={200}
            height={150}
            loading="lazy"
            fit="cover"
            radius="md"
            alt={club.name}
          />
        </Box>

        <Stack gap="xs" style={{ flex: 1 }}>
          <Group gap="xs" justify="center" wrap="wrap">
            {firstLead && (
              <Badge
                size="lg"
                variant="light"
                color="gray"
                leftSection={
                  <UserAvatar user={firstLead.user} size={20} />
                }
              >
                Hosted by {firstLead.user.firstName} {firstLead.user.lastName}
              </Badge>
            )}

            {club.rhythm && (
              <Badge
                size="lg"
                variant="light"
                color="blue"
                leftSection={
                  <IconCalendar size={14} stroke={1.5} />
                }
              >
                {club.rhythm.frequency}
              </Badge>
            )}

            {club.location && (
              <Badge
                size="lg"
                variant="light"
                color="teal"
                leftSection={
                  <IconMapPin size={14} stroke={1.5} />
                }
              >
                {club.location}
              </Badge>
            )}
          </Group>
        </Stack>

        <Button
          fullWidth
          onClick={() => router.push(`/join/${club.publicId}`)}
          variant="light"
        >
          View Club
        </Button>
      </Stack>
    </Card>
  );
}
