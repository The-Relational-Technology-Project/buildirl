"use client";

import { Stack, Title, Text, Center } from "@mantine/core";
import { useParams, useRouter } from "next/navigation";
import ClubImage from "~/client/components/ClubImage";
import { api } from "~/trpc/react";
import { QueryError } from "~/client/utils/QueryError";
import { isLoaded } from "~/client/utils";
import SecondaryButton from "~/client/components/SecondaryButton";

export default function ApplicationCompleted() {
  const params = useParams<{ publicId: string }>();
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
      <Center pt={80} px={{ base: undefined, md: 200 }}>
        <Stack align="center" gap={"lg"}>
          <Title order={1} ta={"center"}>
            THANK YOU FOR APPLYING!
          </Title>
          <Text ta={"center"} size={"lg"}>
          Your application is being reviewed. You’ll receive an email with an update soon.
          </Text>

          <ClubImage club={r.data!} size={240} />

          <SecondaryButton
            mt={"lg"}
            onClick={() => {
              router.push(`/join/${params.publicId}/`);
            }}
          >
            Return Home
          </SecondaryButton>
        </Stack>
      </Center>
    )
  );
}
