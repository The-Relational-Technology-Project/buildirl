import PrimaryButton from "~/client/components/PrimaryButton";
import { isLoaded } from "~/client/utils";
import { membershipForClub } from "~/utils/types";
import { JoinButtonProps } from "./JoinButton";
import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";

export function AuthenticatedJoinButton({ club }: JoinButtonProps) {
  const router = useRouter();
  const userMemberships = api.main.userMemberships.useQuery();

  if (!isLoaded(userMemberships)) {
    return null;
  }

  const membership = membershipForClub(userMemberships.data!, club.id);

  switch (membership?.status) {
    case "PENDING":
      return (
        <PrimaryButton
          includeIcon
          onClick={() => router.push(`/club/${club.id}/manage-application`)}
        >
          Manage Application
        </PrimaryButton>
      );
    case "ACTIVE":
      return (
        <PrimaryButton
          includeIcon
          onClick={() => router.push(`/club/${club.id}/manage-membership`)}
        >
          Manage Membership
        </PrimaryButton>
      );
    case "PENDING_INCOMPLETE":
      return (
        <PrimaryButton
          includeIcon
          onClick={() =>
            router.push(
              `/apply/${club.publicId}/payments?membershipId=${membership.id}`
            )
          }
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
          includeIcon
          onClick={() => router.push(`/join/${club.publicId}/tiers`)}
        >
          Join as a member
        </PrimaryButton>
      );
  }
}
