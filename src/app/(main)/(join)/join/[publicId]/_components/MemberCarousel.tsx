import { api } from "~/trpc/react";
import { QueryError } from "~/client/utils/QueryError";
import { isLoaded } from "~/client/utils";
import { Box, Paper, Stack, Text, ThemeIcon, useMatches } from "@mantine/core";
import { Carousel } from "@mantine/carousel";
import Autoplay from "embla-carousel-autoplay";
import React from "react";
import { IconStarFilled } from "@tabler/icons-react";
import { UserImage } from "~/client/components/UserAvatar";
import { useRouter } from "next/navigation";

type MemberCarouselProps = {
  clubId: number;
};

export default function MemberCarousel({ clubId }: MemberCarouselProps) {
  const router = useRouter();
  const slideWidth = useMatches({ base: 240, md: 300 });

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
    <Box w={"100%"}>
      <Carousel
        slideSize={slideWidth}
        slideGap={"md"}
        align="center"
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
                  boxShadow: "2px 2px 0px",
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
    </Box>
  );
}
