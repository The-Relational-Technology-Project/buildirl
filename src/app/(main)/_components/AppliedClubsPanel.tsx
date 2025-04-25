import { QueryError } from "~/client/utils/QueryError";
import { isLoaded } from "~/client/utils";
import { api } from "~/trpc/react";
import { Stack, Text, Title } from "@mantine/core";
import { DefaultClubImage } from "~/client/components/ClubImage";
import { Membership } from "~/server/service/types";
import ClubCard from "~/app/(main)/_components/ClubCard";

function EmptyClubs() {
  return (
    <Stack justify="center" align="center" gap={"xs"} mih={"60vh"}>
      <DefaultClubImage size={150} />
      <Title order={3} mt={"lg"} style={{ textAlign: "center" }}>
        You have not applied to any clubs
      </Title>
      <Text size={"md"}>Find clubs in your city to join!</Text>
    </Stack>
  );
}

type AppliedClubsProps = {
  membershipApplications: Membership[];
};

function AppliedClubs({ membershipApplications }: AppliedClubsProps) {
  return (
    <Stack>
      {membershipApplications
        .sort((m1, m2) => m1.club.id - m2.club.id)
        .map((m) => (
          <ClubCard key={m.club.id} club={m.club} status={"APPLIED"} />
        ))}
    </Stack>
  );
}

export default function AppliedClubsPanel() {
  const r = api.main.userMemberships.useQuery();

  QueryError.check({
    result: r,
    fieldName: "userMemberships"
  });

  if (!isLoaded(r)) {
    return null;
  }

  const membershipApplications = r.data!.filter((m) => m.status === "PENDING");

  if (membershipApplications.length === 0) {
    return <EmptyClubs />;
  }

  return <AppliedClubs membershipApplications={membershipApplications} />;
}
