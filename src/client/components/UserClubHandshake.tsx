import { User } from "~/server/user/types";
import { Club } from "~/server/club/types";
import { Box, Image, useMatches } from "@mantine/core";
import UserAvatar from "~/client/components/UserAvatar";
import ClubImage from "~/client/components/ClubImage";

type UserClubHandshakeProps = {
  user: User;
  club: Club;
};

export default function UserClubHandshake({
  user,
  club
}: UserClubHandshakeProps) {
  const OVERLAP_SIZE = 20;
  const imageSize = useMatches({ base: 150, md: 200 });
  return (
    <Box pos="relative" w={imageSize * 2 - OVERLAP_SIZE} h={imageSize}>
      <Box pos="absolute" left={0} style={{ zIndex: 2 }}>
        <UserAvatar size={imageSize} user={user} />
      </Box>
      <Box
        pos="absolute"
        left={{ base: imageSize - 40, md: imageSize - 50 }}
        bottom={{ base: -10, md: -20 }}
        style={{ zIndex: 3 }}
      >
        <Image
          src={"/images/thumbs-up.svg"}
          alt={"thumbs up"}
          w={{ base: 50, md: 80 }}
        />
      </Box>

      <Box
        pos="absolute"
        left={imageSize - OVERLAP_SIZE}
        // a bit hacky but since the club image is .75 the height of the user image,
        // we need to adjust here to center
        top={imageSize * 0.125}
        style={{ zIndex: 1 }}
      >
        <ClubImage size={imageSize} club={club} />
      </Box>
    </Box>
  );
}
