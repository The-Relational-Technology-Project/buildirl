"use client";

import React from "react";
import { useParams } from "next/navigation";
import { api } from "~/trpc/react";
import { QueryError } from "~/client/utils/QueryError";
import { isLoaded } from "~/client/utils";
import { WithTemplateTheme } from "~/client/components/WithTemplateTheme";

export default function ApplyLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  const params = useParams<{ publicId: string }>();
  const publicId = params.publicId;

  const r = api.main.clubByPublicId.useQuery({
    publicId
  });
  QueryError.check({
    result: r,
    fieldName: "clubByPublicId"
  });

  return (
    isLoaded(r) && (
      <WithTemplateTheme theme={r.data!.theme}>{children}</WithTemplateTheme>
    )
  );
}
