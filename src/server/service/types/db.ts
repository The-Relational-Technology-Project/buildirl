import {Maybe} from "~/utils/types";
import {User} from "~/server/service/types/api";
import {Prisma} from ".prisma/client";
import JsonValue = Prisma.JsonValue;
import Decimal = Prisma.Decimal;

export type ClubResult = {
    id: number;
    publicId: string;
    name: string;
    tagLine: string;
    description: string;
    owner: User;
    websiteURL: Maybe<string>;
    instagramHandle: Maybe<string>;
    eventCalendarURL: Maybe<string>;
    applicationQuestions: Maybe<JsonValue>;
    membershipTiers: MembershipTierResult[];
}

export type MembershipTierResult = {
    id: number;
    name: string;
    benefitDescription: string;
    contributionDescription: string;
    costPerMonthInUSD: Decimal;
};