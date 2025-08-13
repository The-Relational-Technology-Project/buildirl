// !! PROTOTYPE

"use client";

import { Box } from "@mantine/core";
import React from "react";
import { api } from "~/trpc/react";
import { QueryError } from "~/client/utils/QueryError";
import { useParams } from "next/navigation";
import { BillingInterval } from "~/utils/types";
import CampaignHero from "./__components/CampaignHero";
import CampaignStory from "./__components/CampaignStory";
import ContributionInterface from "./__components/ContributionInterface";
import FinancialAssistance from "./__components/FinancialAssistance";
import { CAMPAIGN_CONFIGURATIONS } from "~/app/(main)/(join)/campaign/[publicId]/config";

function getMembershipCostPerMonth(
  membershipCost: number,
  billingInterval: BillingInterval
): number {
  switch (billingInterval) {
    case BillingInterval.MONTHLY:
      return membershipCost;
    case BillingInterval.QUARTERLY:
      return membershipCost / 3;
    case BillingInterval.SEMI_ANNUAL:
      return membershipCost / 6;
    default:
      throw new Error("Invalid billing interval");
  }
}

export default function Campaign() {
  const params = useParams<{ publicId: string }>();
  const campaignConfiguration = CAMPAIGN_CONFIGURATIONS.find(
    (c) => c.clubPublicId === params.publicId
  );

  if (!campaignConfiguration) {
    throw new Error("campaign is not found");
  }

  const club = api.main.clubByPublicId.useQuery({
    publicId: params.publicId
  });

  const activeMemberships = api.main.activeMembershipsForClub.useQuery(
    { clubId: club.data?.id || 0 },
    { enabled: !!club.data?.id }
  );

  const pendingApplications = api.main.membershipApplicationsForClub.useQuery(
    { clubId: club.data?.id || 0 },
    { enabled: !!club.data?.id }
  );

  QueryError.check({
    result: club,
    fieldName: "club"
  });

  QueryError.check({
    result: activeMemberships,
    fieldName: "activeMembershipsForClub"
  });

  QueryError.check({
    result: pendingApplications,
    fieldName: "membershipApplicationsForClub"
  });

  const goalAmount = campaignConfiguration.monthlyGoal;

  // Get membership tier details
  const membershipTier = club.data?.membershipTiers.find(
    (tier) => tier.id === campaignConfiguration.membershipTierId
  );
  const membershipCost = membershipTier?.costPerBillingInterval || 0;
  const billingInterval =
    membershipTier?.billingInterval || BillingInterval.MONTHLY;
  const membershipCostPerMonth = getMembershipCostPerMonth(
    membershipCost,
    billingInterval
  );

  // Get supporters for this specific tier (active + pending)
  const activeMembersForTier =
    activeMemberships.data?.filter(
      (m) => m.membershipTier.id === campaignConfiguration.membershipTierId
    ) || [];
  const pendingApplicationsForTier =
    pendingApplications.data?.filter(
      (m) => m.membershipTier.id === campaignConfiguration.membershipTierId
    ) || [];
  const supporters = [...activeMembersForTier, ...pendingApplicationsForTier];

  return (
    <Box
      mx={-18}
      style={{
        minHeight: "100vh",
        backgroundColor: "transparent",
        position: "relative",
        overflow: "hidden",
        zIndex: 10
      }}
    >
      {/* Content */}
      <CampaignHero
        membershipTierId={campaignConfiguration.membershipTierId}
        membershipCostPerMonth={membershipCostPerMonth}
        billingInterval={billingInterval}
        supporters={supporters}
        goalAmount={goalAmount}
        clubPublicId={club.data!.publicId}
        campaignConfiguration={campaignConfiguration}
        club={club.data!}
      />
      <CampaignStory
        club={club.data!}
        membershipTierId={campaignConfiguration.membershipTierId}
        campaignConfiguration={campaignConfiguration}
      />
      <ContributionInterface
        club={club.data!}
        membershipTierId={campaignConfiguration.membershipTierId}
        goalAmount={goalAmount}
      />
      <FinancialAssistance campaignConfiguration={campaignConfiguration} />
    </Box>
  );
}
