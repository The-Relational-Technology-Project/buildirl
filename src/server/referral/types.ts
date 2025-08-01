// !! PROTOTYPE

export type ReferralService = {
  submitReferralEmails: (referrerId: number, emails: string[]) => Promise<void>;
};
