import { QueryError } from "~/client/utils/QueryError";
import { isAllLoaded } from "~/client/utils";
import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";
import { Stack, Text, Title, Box, useMatches } from "@mantine/core";
import { WelcomeImage } from "~/client/components/Images";
import { Club, Membership } from "~/server/membership/types";
import ClubCard from "~/app/(main)/_components/ClubCard";
import PrimaryButton from "~/client/components/PrimaryButton";

function EmptyClubs() {
  const imageSize = useMatches({ base: 200, md: 300 });
  const router = useRouter();
  return (
    <Stack justify="center" align="center" gap={"xs"} mih={"60vh"}>
      <WelcomeImage size={imageSize} />
      <Title order={3} style={{ textAlign: "center" }}>
        {"You're not a part of any clubs. Let's fix that! 🎉"}
      </Title>
      <Text size={"md"}>Join clubs or build one of your own.</Text>
      <PrimaryButton
        onClick={() => router.push("/club/create")}
        mt={"md"}
        size={"lg"}
      >
        Build a club
      </PrimaryButton>
    </Stack>
  );
}

type MyClubsProps = {
  ownedClubs: Club[];
  activeMemberships: Membership[];
};

function MyClubs({ ownedClubs, activeMemberships }: MyClubsProps) {
  const router = useRouter();
  return (
    <Stack>
      {ownedClubs
        .sort((c1, c2) => c1.id - c2.id)
        .map((c) => (
          <ClubCard key={c.id} club={c} status={"OWNED"} />
        ))}
      {activeMemberships
        .sort((m1, m2) => m1.club.id - m2.club.id)
        .map((m) => (
          <ClubCard key={m.club.id} club={m.club} status={"JOINED"} />
        ))}
      <Box mt={10} style={{ alignSelf: "center" }}>
        <PrimaryButton
          onClick={() => router.push("/club/create")}
          size={"lg"}
          includeIcon
        >
          Build a club
        </PrimaryButton>
      </Box>
    </Stack>
  );
}

export default function MyClubsPanel() {
  const r = api.main.userOwnedClubs.useQuery();
  const m = api.main.userMemberships.useQuery();

  QueryError.check({
    result: r,
    fieldName: "userOwnedClubs"
  });

  QueryError.check({
    result: m,
    fieldName: "userMemberships"
  });

  if (!isAllLoaded([r, m])) {
    return null;
  }

  const activeMemberships = m.data!.filter((m) => m.status === "ACTIVE");

  if (r.data!.length === 0 && activeMemberships.length === 0) {
    return <EmptyClubs />;
  }

  return <MyClubs ownedClubs={r.data!} activeMemberships={activeMemberships} />;
}
