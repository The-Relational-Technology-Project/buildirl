// !! PROTOTYPE

import { Icon } from "@tabler/icons-react";

export type CampaignConfiguration = {
  clubId: number;
  membershipId: bigint;

  subheader: string;
  location: string;
  time: string;
  frequency: string;

  monthlyGoal: number;
  spendCategories: [SpendCategory];
  targetDate: Date;

  hostNames: [string];
  whoWeAre: string;
  howWeHang: string;
  whyJoinUs: [string];
  pictureUrls: [string];
  values: [Value];
  contactUsEmail: string;
};

type SpendCategory = {
  description: string;
  cost: number;
};

type Value = {
  icon: Icon;
  heading: string;
  description: string;
};

export const CAMPAIGN_CONFIGURATIONS: CampaignConfiguration = [{}];
