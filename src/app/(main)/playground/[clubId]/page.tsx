"use client";

import { ClubDisplayImageGallery } from "~/app/(main)/playground/[clubId]/__components/ClubDisplayImageGallery";
import { useParams } from "next/navigation";
import { strictParseInt } from "~/utils";
import { api } from "~/trpc/react";
import { QueryError } from "~/client/utils/QueryError";
import { Stack, Title } from "@mantine/core";
import { ClubDisplayImageUpload } from "~/app/(main)/playground/[clubId]/__components/ClubDisplayImageUpload";
import { isLoaded } from "~/client/utils";

export default function Playground() {
  const params = useParams<{ clubId: string }>();
  const clubId = strictParseInt(params.clubId);

  const r = api.main.club.useQuery({ id: clubId });

  QueryError.check({
    result: r,
    fieldName: "club"
  });

  return (
    isLoaded(r) && (
      <Stack>
        <Title>Club Images</Title>
        <ClubDisplayImageGallery club={r.data!} />
        <ClubDisplayImageUpload club={r.data!} />
      </Stack>
    )
  );
}
