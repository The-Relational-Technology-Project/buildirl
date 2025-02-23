import { Club, User } from "~/server/service/types";
import { Box, Image } from "@mantine/core";
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
  return (
    <Box pos="relative" w={240} h={120}>
      <Box pos="absolute" left={0} style={{ zIndex: 2 }}>
        <UserAvatar size={"lg"} user={user} />
      </Box>
      <Box pos="absolute" left={90} bottom={-10} style={{ zIndex: 3 }}>
        <Image src={"/images/thumbs-up.svg"} w={50} />
      </Box>
      <Box pos="absolute" left={115} style={{ zIndex: 1 }}>
        <ClubImage size={120} club={club} />
      </Box>
    </Box>
  );
}
