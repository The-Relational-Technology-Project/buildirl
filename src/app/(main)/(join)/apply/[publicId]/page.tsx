"use client";

import {
  Stack,
  Title,
  Center,
  useMatches,
  useMantineColorScheme,
  useMantineTheme
} from "@mantine/core";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { api } from "~/trpc/react";
import { QueryError } from "~/client/utils/QueryError";
import { isLoaded } from "~/client/utils";
import WithLocalNavigationHeader from "~/client/components/WithLocalNavigationHeader";
import { strictParseInt } from "~/utils";
import { FitCheckImage } from "~/client/components/Images";
import PrimaryButton from "~/client/components/PrimaryButton";
import React from "react";

export default function Apply() {
  const imageSize = useMatches({ base: 300, md: 360 });
  const { colorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();
  const isDark = colorScheme === "dark";
  const headingColor = isDark ? theme.other.dark.text : "black";

  const params = useParams<{ publicId: string }>();
  const searchParams = useSearchParams();
  const membershipTierId = strictParseInt(searchParams.get("membershipTierId"));
  const router = useRouter();

  const club = api.main.clubByPublicId.useQuery({
    publicId: params.publicId
  });

  QueryError.check({
    result: club,
    fieldName: "clubByPublicId"
  });

  return (
    isLoaded(club) && (
      // TODO there is an edge case with anonymous users signing up with Google SSO
      //  clicking back here causing issues. I haven't thought of an elegant way to
      //  handle this
      <WithLocalNavigationHeader>
        <Center pt={30} px={40}>
          <Stack align="center" gap="lg" mb={"xl"}>
            <Title order={1} c={headingColor}>
              YOU ROCK!
            </Title>

            <FitCheckImage size={imageSize} />

            <Title order={2} fw={500} ta="center" c={headingColor}>
              {"Let’s see if we’re a fit."}
            </Title>

            <PrimaryButton
              mt={"md"}
              onClick={() => {
                router.push(
                  `/apply/${club.data!.publicId}/intake?membershipTierId=${membershipTierId}`
                );
              }}
            >
              {"Let's Go!"}
            </PrimaryButton>
          </Stack>
        </Center>
      </WithLocalNavigationHeader>
    )
  );
}
