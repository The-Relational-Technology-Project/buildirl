// admin is super-management capabilities (e.g., elevated role updates on membership, etc)
export type AppAction = "manage" | "admin";

export type AppSubject = keyof AppSubjects | AppSubjects[keyof AppSubjects];

export type UserSubject = {
  id: number;
};

export type ClubSubject = {
  id: number;
};

export type MembershipTierSubject = {
  id: number;
};

export type MembershipSubject = {
  id: bigint;
};

export type AppSubjects = {
  User: Partial<UserSubject>;
  Club: Partial<ClubSubject>;
  MembershipTier: Partial<MembershipTierSubject>;
  Membership: Partial<MembershipSubject>;
};
