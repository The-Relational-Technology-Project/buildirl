import PrimaryButton from "~/client/components/PrimaryButton";
import { isLoaded } from "~/client/utils";
import { membershipForClub } from "~/utils/types";
import { JoinButtonProps } from "./JoinButton";
import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";
import { useMatches } from "@mantine/core";

export function AuthenticatedJoinButton({ club }: JoinButtonProps) {
  const router = useRouter();
  const userMemberships = api.main.userMemberships.useQuery();
  const buttonFont = club.themeHeadingFont ?? undefined;
  const manageApplicationLabel = useMatches({
    base: "Manage",
    sm: "Manage Application"
  });

  if (!isLoaded(userMemberships)) {
    return null;
  }

  const membership = membershipForClub(userMemberships.data!, club.id);

  switch (membership?.status) {
    case "PENDING":
      return (
        <PrimaryButton
          onClick={() => router.push(`/club/${club.id}/manage-application`)}
          fontFamily={buttonFont}
          accentColor={club.accentColor}
        >
          {manageApplicationLabel}
        </PrimaryButton>
      );
    case "ACTIVE":
      return (
        <PrimaryButton
          onClick={() => router.push(`/club/${club.id}/manage-membership`)}
          fontFamily={buttonFont}
          accentColor={club.accentColor}
          fz={{ base: "sm", md: "lg" }}
          letterSpacingMobile="0.04em"
        >
          Manage Membership
        </PrimaryButton>
      );
    case "PENDING_INCOMPLETE":
      return (
        <PrimaryButton
          onClick={() =>
            router.push(
              `/apply/${club.publicId}/payments?membershipId=${membership.id}`
            )
          }
          fontFamily={buttonFont}
          accentColor={club.accentColor}
        >
          Complete Application
        </PrimaryButton>
      );
    case "DECLINED":
    case "INACTIVE":
    case "WITHDRAWN":
    // no membership
    default:
      return (
        <PrimaryButton
          onClick={() => router.push(`/join/${club.publicId}/tiers`)}
          fontFamily={buttonFont}
          accentColor={club.accentColor}
        >
          join the club
        </PrimaryButton>
      );
  }
}
