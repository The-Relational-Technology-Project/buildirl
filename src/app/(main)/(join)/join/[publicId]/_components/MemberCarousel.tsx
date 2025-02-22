import { User } from "~/server/service/types";
import { api } from "~/trpc/react";
import { QueryError } from "~/client/utils/QueryError";
import { isLoaded } from "~/client/utils";
import { Box, Paper, Stack, Text, ThemeIcon } from "@mantine/core";
import { Carousel } from "@mantine/carousel";
import Autoplay from "embla-carousel-autoplay";
import React from "react";
import { IconStarFilled } from "@tabler/icons-react";
import UserAvatar, { UserImage } from "~/client/components/UserAvatar";

type MemberCarouselProps = {
  clubId: number;
  owner: User;
};

export default function MemberCarousel({ clubId, owner }: MemberCarouselProps) {
  const r = api.main.activeMembershipsForClub.useQuery({
    clubId: clubId
  });

  QueryError.check({
    result: r,
    fieldName: "activeMembershipsForClub"
  });

  if (!isLoaded(r)) {
    return null;
  }

  const allMembers = [owner, ...r.data!.map((m) => m.user)];

  const autoplay = Autoplay({ delay: 2000, stopOnInteraction: false });
  const slideWidth = { base: 150, md: 250 };

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
        {allMembers.map((m) => (
          <Carousel.Slide key={m.id}>
            <Stack align="center" pos="relative">
              {m.id === owner.id && (
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
              <Paper>
                <UserImage
                  h={{ base: 200, md: 300 }}
                  w={slideWidth}
                  radius={"xs"}
                  user={m}
                />
              </Paper>
              <Text size="md" fw={500}>
                {m.firstName}
              </Text>
            </Stack>
          </Carousel.Slide>
        ))}
      </Carousel>
    </Box>
  );
}
