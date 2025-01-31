"use client";

import { Stack, Title, Text, Button, Paper, Center } from "@mantine/core";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { api } from "~/trpc/react";
import { QueryError } from "~/client/utils/QueryError";
import { isLoaded } from "~/client/utils";
import { WithLocalNavigationHeader } from "~/client/components/WithLocalNavigationHeader";
import { strictParseInt } from "~/utils";
import { Image } from "@mantine/core";
import { HEADER_BAR_HEIGHT } from "~/client/components/HeaderBar";

export default function Apply() {
  const params = useParams<{ publicId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const membershipTierId = strictParseInt(searchParams.get("membershipTierId"));

  const r = api.main.clubByPublicId.useQuery({
    publicId: params.publicId
  });

  const submitApplication = api.main.submitMembershipApplication.useMutation({
    onSuccess: () => {
      router.push(`/join/${params.publicId}/applied`);
    }
  });

  QueryError.check({
    result: r,
    fieldName: "clubByPublicId"
  });

  return (
    isLoaded(r) && (
      <WithLocalNavigationHeader>
        <Center h={`calc(100vh - ${HEADER_BAR_HEIGHT}px)`} pb={200}>
          <Paper w={400} h={400} p={"xl"} withBorder>
            <Stack align="center" gap="xl">
              <Title order={2}>You Rock!</Title>

              <Image
                src={"/abstract-design.svg"}
                h={120}
                w={120}
                alt={"abstract art"}
              />

              <Text c="dimmed" ta="center">
                Let's See If We're A Fit!
              </Text>

              <Button
                variant="filled"
                color="violet"
                size="lg"
                onClick={() => {
                  submitApplication.mutate({
                    membershipTierId,
                    input: {
                      applicationResponses: {}
                    }
                  });
                }}
                loading={submitApplication.isPending}
              >
                Apply
              </Button>
            </Stack>
          </Paper>
        </Center>
      </WithLocalNavigationHeader>
    )
  );
}
