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
          <Title order={2} ta={"center"}>
            THANK YOU FOR APPLYING!
          </Title>
          <Text ta={"center"}>
            Your application will be reviewed as soon as possible. Please check
            back here.
          </Text>

          <ClubImage club={r.data!} size={180} />

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
