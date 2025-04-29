import { QueryError } from "~/client/utils/QueryError";
import { isAllLoaded } from "~/client/utils";
import { api } from "~/trpc/react";
import { Stack, Text, Title } from "@mantine/core";
import { Club, Membership } from "~/server/service/types";
import ClubCard from "~/app/(main)/_components/ClubCard";
import { WelcomeImage } from "~/client/components/Images";
import { useMatches } from "@mantine/core";

function EmptyClubs() {
  const imageSize = useMatches({ base: 200, md: 300 });
  return (
    <Stack justify="center" align="center" gap={"xs"} mih={"60vh"}>
      <WelcomeImage size={imageSize} />
      <Title order={3} style={{ textAlign: "center" }}>
        You have not followed or applied to any clubs
      </Title>
      <Text size={"md"}>Find clubs in your city to join!</Text>
    </Stack>
  );
}

type InterestedClubsProps = {
  membershipApplications: Membership[];
  followedClubs: Club[];
};

function InterestedClubs({
  membershipApplications,
  followedClubs
}: InterestedClubsProps) {
  const applicationClubIds = membershipApplications.map((m) => m.club.id);
  // filter out followed clubs that are already in applications
  const followedClubsNotInApplications = followedClubs.filter(
    (club) => !applicationClubIds.includes(club.id)
  );
  return (
    <Stack>
      {membershipApplications
        .sort((m1, m2) => m1.club.id - m2.club.id)
        .map((m) => (
          <ClubCard key={m.club.id} club={m.club} status={"APPLIED"} />
        ))}
      {followedClubsNotInApplications
        .sort((c1, c2) => c1.id - c2.id)
        .map((c) => (
          <ClubCard key={c.id} club={c} status={"FOLLOWING"} />
        ))}
    </Stack>
  );
}

export default function InterestedClubsPanel() {
  const userMemberships = api.main.userMemberships.useQuery();
  const userFollowedClubs = api.main.userFollowedClubs.useQuery();

  QueryError.check({
    result: userMemberships,
    fieldName: "userMemberships"
  });

  QueryError.check({
    result: userFollowedClubs,
    fieldName: "userFollowedClubs"
  });

  if (!isAllLoaded([userMemberships, userFollowedClubs])) {
    return null;
  }

  const membershipApplications = userMemberships.data!.filter(
    (m) => m.status === "PENDING"
  );

  if (
    membershipApplications.length === 0 &&
    userFollowedClubs.data!.length === 0
  ) {
    return <EmptyClubs />;
  }

  return (
    <InterestedClubs
      membershipApplications={membershipApplications}
      followedClubs={userFollowedClubs.data!}
    />
  );
}
