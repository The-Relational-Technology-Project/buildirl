import PrimaryButton from "~/client/components/PrimaryButton";
import { JoinButtonProps } from "./JoinButton";
import { useRouter } from "next/navigation";

export function DefaultJoinButton({ club }: JoinButtonProps) {
  const router = useRouter();
  return (
    <PrimaryButton
      includeIcon
      onClick={() => router.push(`/join/${club.publicId}/tiers#contribution-reasons`)}
    >
      Join the club
    </PrimaryButton>
  );
}
