import { Club, Rhythm } from "~/server/club/types";
import { MembershipTier } from "~/server/membershipTier/types";

export const getRhythmString = (rhythm: Rhythm) => {
  if (!rhythm.frequency || !rhythm.startDate || !rhythm.startTime) {
    return null;
  }
  const weekday = new Date(rhythm.startDate).toLocaleDateString("en-US", {
    weekday: "long"
  });
  const time = new Date(`1970-01-01T${rhythm.startTime}`)
    .toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    })
    .toLowerCase()
    .replace(" ", "");
  const frequency = rhythm.frequency.toUpperCase();

  return `${frequency} \u2022 ${weekday}s @ ${time}`;
};

export const getAvatarEmoji = () => {
  const emojis = [
    "\u{1F3C0}",
    "\u{265F}\u{FE0F}",
    "\u{1F3B1}",
    "\u{1F4DA}",
    "\u{1F3AE}",
    "\u{1F3D3}",
    "\u{1F3C8}",
    "\u{1F3C9}",
    "\u{1F3B2}",
    "\u{1F3C3}",
    "\u{1F3A4}",
    "\u{1F3B8}",
    "\u{1F3A3}",
    "\u{1F3B5}",
    "\u{1F3A8}",
    "\u{1F3AF}",
    "\u{1F3BE}",
    "\u{1F3C6}",
    "\u{1F3C4}",
    "\u{1F3CA}",
    "\u{1F94B}",
    "\u{1F3BD}",
    "\u{1F3BF}",
    "\u{1F6B4}",
    "\u{1F3CB}\u{FE0F}",
    "\u{1F3CC}\u{FE0F}",
    "\u{1F3B9}",
    "\u{1F3A9}",
    "\u{1F3AC}",
    "\u{1F3AD}"
  ];
  const index = Math.floor(Math.random() * emojis.length);
  return emojis[index];
};

export const getDaysLeftColor = (daysLeft: number): string => {
  if (daysLeft === 1) {
    return "red";
  } else if (daysLeft <= 3) {
    return "orange";
  } else return "lilac";
};

export const getProgressBarColor = (membersNeeded: number): string => {
  if (membersNeeded > 0) {
    return "lilac";
  } else {
    return "green";
  }
};

export const getMonthlyPrice = (tier: MembershipTier) => {
  if (tier.billingInterval === "MONTHLY") return tier.costPerBillingInterval;
  if (tier.billingInterval === "QUARTERLY")
    return tier.costPerBillingInterval / 3;
  if (tier.billingInterval === "SEMI_ANNUAL")
    return tier.costPerBillingInterval / 6;
  return tier.costPerBillingInterval;
};

export const getLowestPaidMembershipTier = (club: Club) => {
  const paidTiers = club.membershipTiers.filter(
    (tier) => getMonthlyPrice(tier) > 0
  );

  if (paidTiers.length === 0) return 0;

  const lowestTier = paidTiers.reduce((cheapest, tier) =>
    getMonthlyPrice(tier) < getMonthlyPrice(cheapest) ? tier : cheapest
  );

  return getMonthlyPrice(lowestTier).toFixed(2);
};
