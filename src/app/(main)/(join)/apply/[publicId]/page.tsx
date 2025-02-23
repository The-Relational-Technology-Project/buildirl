"use client";

import { Stack, Title, Center, useMatches } from "@mantine/core";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { api } from "~/trpc/react";
import { QueryError } from "~/client/utils/QueryError";
import { isLoaded } from "~/client/utils";
import WithLocalNavigationHeader from "~/client/components/WithLocalNavigationHeader";
import { strictParseInt } from "~/utils";
import { DefaultClubImage } from "~/client/components/ClubImage";
import PrimaryButton from "~/client/components/PrimaryButton";
import React from "react";
import AbsoluteCenter from "~/client/components/AbsoluteCenter";

export default function Apply() {
  const params = useParams<{ publicId: string }>();
  const searchParams = useSearchParams();
  const membershipTierId = strictParseInt(searchParams.get("membershipTierId"));
  const router = useRouter();

  const r = api.main.clubByPublicId.useQuery({
    publicId: params.publicId
  });

  QueryError.check({
    result: r,
    fieldName: "clubByPublicId"
  });

  return (
    isLoaded(r) && (
      <WithLocalNavigationHeader>
        <Center pt={30} px={40}>
          <Stack align="center" gap="lg">
            <Title order={1}>You Rock!</Title>

            <DefaultClubImage size={180} />

            <Title order={2} fw={500} ta="center">
              Let's See If We're A Fit!
            </Title>

            <PrimaryButton
              size="lg"
              w={200}
              mt={"md"}
              onClick={() => {
                router.push(
                  `/apply/${r.data!.publicId}/intake?membershipTierId=${membershipTierId}`
                );
              }}
              hideIcon
            >
              Let's Go!
            </PrimaryButton>
          </Stack>
        </Center>
      </WithLocalNavigationHeader>
    )
  );
}
