"use client";

import { useParams, useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { QueryError } from "~/client/utils/QueryError";
import { isAllLoaded } from "~/client/utils";
import { Button, Center, Group, Stack, Title } from "@mantine/core";
import ClubImage from "~/client/components/ClubImage";
import { strictParseInt } from "~/utils";
import UserAvatar from "~/client/components/UserAvatar";
import PrimaryButton, {
  BUTTON_STANDARD_WIDTH
} from "~/client/components/PrimaryButton";
import UserClubHandshake from "~/client/components/UserClubHandshake";

export default function Share() {
  const params = useParams<{ publicId: string; userId: string }>();
  const publicId = params.publicId;
  const userId = strictParseInt(params.userId);
  const router = useRouter();

  const r = api.main.clubByPublicId.useQuery({ publicId });
  const u = api.main.userById.useQuery({ id: userId });

  QueryError.check({
    result: r,
    fieldName: "clubByPublicId"
  });

  QueryError.check({
    result: u,
    fieldName: "userById"
  });

  if (!isAllLoaded([r, u])) {
    return null;
  }

  // TODO restrict share page only to active members. This requires creating a public procedure to
  //  get club active membership status. We do not want to open up userMemberships endpoint broadly as
  //  it contains sensitive data

  return (
    <Center pt={50}>
      <Stack align="center" gap="xl" mt={"xl"}>
        <Title order={2}>I'M A PROUD JOINER!</Title>

        <UserClubHandshake user={u.data!} club={r.data!} />

        <Stack gap={"sm"} align={"center"}>
          <Title order={3} mt={"sm"} fw={400}>
            I Am a Member Of
          </Title>
          <Title order={3}>{r.data!.name}!</Title>
        </Stack>

        <PrimaryButton
          onClick={() => router.push(`/join/${publicId}`)}
          w={BUTTON_STANDARD_WIDTH}
        >
          Join Me
        </PrimaryButton>
      </Stack>
    </Center>
  );
}
