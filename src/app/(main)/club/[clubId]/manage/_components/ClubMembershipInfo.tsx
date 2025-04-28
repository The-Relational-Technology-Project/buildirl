import React from "react";
import { api } from "~/trpc/react";
import { QueryError } from "~/client/utils/QueryError";
import { isLoaded } from "~/client/utils";
import MemberCountStatistic from "~/client/components/MemberCountStatistic";
import AlertMessage from "~/client/components/AlertMessage";
import { Box, BoxProps } from "@mantine/core";

type ClubMembershipInfoProps = {
  clubId: number;
};

export default function ClubMembershipInfo({
  clubId,
  ...props
}: ClubMembershipInfoProps & BoxProps) {
  const clubStatistics = api.main.clubStatistics.useQuery({
    clubId
  });

  QueryError.check({
    result: clubStatistics,
    fieldName: "clubStatistics"
  });

  if (!isLoaded(clubStatistics)) {
    return null;
  }

  return (
    <Box {...props}>
      <MemberCountStatistic
        clubId={clubId}
        clubStatistics={clubStatistics.data}
      />

      {clubStatistics.data?.memberCount === 1 && (
        <AlertMessage
          message={
            "Customize your membership tiers and intake tabs, then share your club link to invite your first members."
          }
          mt={4}
        />
      )}
    </Box>
  );
}
