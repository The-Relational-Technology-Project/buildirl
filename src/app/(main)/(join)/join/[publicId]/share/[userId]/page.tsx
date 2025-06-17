"use client";

import { useParams, useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { QueryError } from "~/client/utils/QueryError";
import { isAllLoaded } from "~/client/utils";
import { Center, Stack, Title } from "@mantine/core";
import { strictParseInt } from "~/utils";
import PrimaryButton from "~/client/components/PrimaryButton";
import UserClubHandshake from "~/client/components/UserClubHandshake";

export default function Share() {
  const params = useParams<{ publicId: string; userId: string }>();
  const publicId = params.publicId;
  const userId = strictParseInt(params.userId);
  const router = useRouter();

  const club = api.main.clubByPublicId.useQuery({ publicId });
  const user = api.main.userById.useQuery({ id: userId });

  QueryError.check({
    result: club,
    fieldName: "clubByPublicId"
  });

  QueryError.check({
    result: user,
    fieldName: "userById"
  });

  if (!isAllLoaded([club, user])) {
    return null;
  }

  // TODO restrict share page only to active members. This requires creating a public procedure to
  //  get club active membership status. We do not want to open up userMemberships endpoint broadly as
  //  it contains sensitive data

  return (
    <Center pt={50}>
      <Stack align="center" gap="xl" mt={"xl"}>
        <Title order={1} ta={"center"}>
          {"I'M A PROUD JOINER!"}
        </Title>

        <UserClubHandshake user={user.data!} club={club.data!} />

        <Stack gap={"sm"} align={"center"}>
          <Title order={2} mt={"sm"} fw={400}>
            I Am a Member Of
          </Title>
          <Title order={2}>{club.data!.name}!</Title>
        </Stack>

        <PrimaryButton onClick={() => router.push(`/join/${publicId}`)}>
          Join Me
        </PrimaryButton>
      </Stack>
    </Center>
  );
}
