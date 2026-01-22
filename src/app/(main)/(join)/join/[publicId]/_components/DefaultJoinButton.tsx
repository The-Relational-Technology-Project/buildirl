import PrimaryButton from "~/client/components/PrimaryButton";
import { JoinButtonProps } from "./JoinButton";
import { useRouter } from "next/navigation";

export function DefaultJoinButton({ club }: JoinButtonProps) {
  const router = useRouter();
  const buttonFont = club.themeHeadingFont ?? undefined;
  return (
    <PrimaryButton
      onClick={() => router.push(`/join/${club.publicId}/tiers`)}
      fontFamily={buttonFont}
    >
      join the club
    </PrimaryButton>
  );
}
