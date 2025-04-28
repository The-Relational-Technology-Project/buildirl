import React from "react";
import { api } from "~/trpc/react";
import { QueryError } from "~/client/utils/QueryError";
import { isLoaded } from "~/client/utils";
import MemberCountStatistic from "~/client/components/MemberCountStatistic";
import AlertMessage from "~/client/components/AlertMessage";
import { Box } from "@mantine/core";

type ClubMembershipInfoProps = {
  clubId: number;
  mt?: string | number;
};

export default function ClubMembershipInfo({ 
  clubId, 
  mt 
}: ClubMembershipInfoProps) {
  const clubStatsQuery = api.main.clubStatistics.useQuery({ 
    clubId
  });

  QueryError.check({
    result: clubStatsQuery,
    fieldName: "clubStatistics"
  });

  if (!isLoaded(clubStatsQuery)) return null;

  return (
    <Box mt={mt}>
      <MemberCountStatistic 
        clubId={clubId} 
        clubStatistics={clubStatsQuery.data}
      />
      
      {clubStatsQuery.data?.memberCount === 1 && (
        <AlertMessage
          message={"Customize your membership tiers and intake tabs, then share your club link to invite your first members."}
          mt={4}
        />
      )}
    </Box>
  );
} 