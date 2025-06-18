"use client";

import React from "react";
import { useParams } from "next/navigation";
import { api } from "~/trpc/react";
import { QueryError } from "~/client/utils/QueryError";
import { isLoaded } from "~/client/utils";
import WithTemplateTheme from "~/client/components/WithTemplateTheme";

export default function JoinLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  const params = useParams<{ publicId: string }>();
  const publicId = params.publicId;

  const club = api.main.clubByPublicId.useQuery({
    publicId
  });
  QueryError.check({
    result: club,
    fieldName: "clubByPublicId"
  });

  return (
    isLoaded(club) && (
      <WithTemplateTheme theme={club.data!.theme}>{children}</WithTemplateTheme>
    )
  );
}
