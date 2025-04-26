import { QueryError } from "~/client/utils/QueryError";
import { isAllLoaded } from "~/client/utils";
import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";
import { Button, Stack, Text, Title } from "@mantine/core";
import { WelcomeImage } from "~/client/components/ClubImage";
import { Club, Membership } from "~/server/service/types";
import ClubCard from "~/app/(main)/_components/ClubCard";

function EmptyClubs() {
  const router = useRouter();
  return (
    <Stack justify="center" align="center" gap={"xs"} mih={"60vh"}>
      <WelcomeImage size={200} />
      <Title order={3} mt={"lg"} style={{ textAlign: "center" }}>
        You&apos;re not a part of any clubs. Let&apos;s fix that! 🎉
      </Title>
      <Text size={"md"}>Join clubs or build one of your own.</Text>
      <Button 
        onClick={() => router.push("/club/create")} 
        mt={"md"} 
        size={"lg"}
        radius="xl"
      >
        Build a club
      </Button>
    </Stack>
  );
}

type MyClubsProps = {
  ownedClubs: Club[];
  activeMemberships: Membership[];
};

function MyClubs({ ownedClubs, activeMemberships }: MyClubsProps) {
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
      <Text
        size={"sm"}
        style={{ alignSelf: "center", textAlign: "center" }}
        mt={10}
      >
        {"Join a club or "}
        <a href="/club/create" style={{ color: "inherit" }}>
          create
        </a>{" "}
        one of your own.
      </Text>
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
