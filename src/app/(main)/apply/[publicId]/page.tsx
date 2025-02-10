"use client";

import { Stack, Title, Text, Button, Paper } from "@mantine/core";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { api } from "~/trpc/react";
import { QueryError } from "~/client/utils/QueryError";
import { isLoaded } from "~/client/utils";
import { WithLocalNavigationHeader } from "~/client/components/WithLocalNavigationHeader";
import { strictParseInt } from "~/utils";
import { Image } from "@mantine/core";
import { AbsoluteCenter } from "~/client/components/AbsoluteCenter";

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
        <AbsoluteCenter adjustForHeader>
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
                  router.push(
                    `/apply/${r.data!.publicId}/intake?membershipTierId=${membershipTierId}`
                  );
                }}
              >
                Let's Go
              </Button>
            </Stack>
          </Paper>
        </AbsoluteCenter>
      </WithLocalNavigationHeader>
    )
  );
}
