import { api } from "~/trpc/react";
import { QueryError } from "~/client/utils/QueryError";
import { isLoaded } from "~/client/utils";
import {
  Paper,
  Stack,
  Text,
  ThemeIcon,
  Title,
  useMantineColorScheme,
  useMantineTheme,
  useMatches
} from "@mantine/core";
import { Carousel } from "@mantine/carousel";
import Autoplay from "embla-carousel-autoplay";
import React from "react";
import { IconStarFilled } from "@tabler/icons-react";
import { UserImage } from "~/client/components/UserAvatar";
import { useRouter } from "next/navigation";
import { Club, ClubStatistics } from "~/server/club/types";

type MemberCarouselProps = {
  club: Club;
  clubStatistics: ClubStatistics;
};

export default function MemberCarousel({
  club,
  clubStatistics
}: MemberCarouselProps) {
  const router = useRouter();
  const { colorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();

  const slideWidth = useMatches({ base: 100, md: 150 });
  const clubId = club.id;

  const activeMembershipsForClub = api.main.activeMembershipsForClub.useQuery({
    clubId: clubId
  });

  QueryError.check({
    result: activeMembershipsForClub,
    fieldName: "activeMembershipsForClub"
  });

  if (!isLoaded(activeMembershipsForClub)) {
    return null;
  }

  const autoplay = Autoplay({ delay: 2000, stopOnInteraction: false });
  return (
    <Stack
      w={"100%"}
      bg={
        colorScheme === "dark" ? theme.colors.dark![3] : theme.colors.beige![1]
      }
      p={28}
      bdrs={4}
      mb={32}
      gap={32}
    >
      <Stack align={"center"} gap={4}>
        <Title
          order={2}
          tt="uppercase"
          style={{
            fontFamily: club.themeHeadingFont ?? "inherit",
            textAlign: "center"
          }}
        >
          Meet the club
        </Title>
        <Text
          style={{ cursor: "pointer" }}
          onClick={() => router.push(`/join/${club.publicId}/members`)}
          size={"md"}
          td={"underline"}
        >
          {`View all ${clubStatistics.memberCount} contributing member${clubStatistics.memberCount > 1 ? "s" : ""}`}
        </Text>
      </Stack>

      <Carousel
        slideSize={slideWidth}
        slideGap={"md"}
        align="start"
        plugins={[autoplay]}
        loop
        withControls={false}
      >
        {activeMembershipsForClub.data!.map((m) => (
          <Carousel.Slide key={m.id}>
            <Stack align="center" pos="relative">
              {m.role === "LEAD" && (
                <ThemeIcon
                  variant="filled"
                  color="yellow.5"
                  pos="absolute"
                  top={2}
                  right={2}
                  radius={"xs"}
                  p={4}
                  style={{ zIndex: 100 }}
                >
                  <IconStarFilled />
                </ThemeIcon>
              )}
              <Paper
                onClick={() => router.push(`/user/${m.id}?back=true`)}
                style={{
                  border: "1px solid",
                  cursor: "pointer"
                }}
              >
                <UserImage
                  h={slideWidth * 1.3}
                  w={slideWidth}
                  radius={"xs"}
                  user={m.user}
                />
              </Paper>
              <Text size="md" fw={500}>
                {m.user.firstName}
              </Text>
            </Stack>
          </Carousel.Slide>
        ))}
      </Carousel>
    </Stack>
  );
}
