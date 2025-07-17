import { Group } from "@mantine/core";
import {
  IconBrandTwitter,
  IconBrandInstagram,
  IconBrandFacebook,
  IconBrandLinkedin,
  IconWorld
} from "@tabler/icons-react";
import { UserSocials } from "~/server/user/types";
import { ActionIconBox } from "~/client/components/ColorSchemeAwareActionIcon";

type UserSocialLinksProps = {
  socials?: UserSocials;
  size?: "sm" | "md" | "lg";
};

function hasAnySocials(socials: UserSocials): boolean {
  return !!(
    socials.twitter ||
    socials.instagram ||
    socials.facebook ||
    socials.linkedin ||
    socials.website
  );
}

export default function UserSocialLinks({ socials, size = "lg" }: UserSocialLinksProps) {
  if (!socials || !hasAnySocials(socials)) {
    return null;
  }

  return (
    <Group gap="xs">
      {socials.twitter && (
        <ActionIconBox
          onClick={() => window.open(`https://twitter.com/${socials.twitter}`)}
          icon={<IconBrandTwitter />}
          size={size}
        />
      )}
      {socials.instagram && (
        <ActionIconBox
          onClick={() => window.open(`https://instagram.com/${socials.instagram}`)}
          icon={<IconBrandInstagram />}
          size={size}
        />
      )}
      {socials.facebook && (
        <ActionIconBox
          onClick={() => window.open(`https://facebook.com/${socials.facebook}`)}
          icon={<IconBrandFacebook />}
          size={size}
        />
      )}
      {socials.linkedin && (
        <ActionIconBox
          onClick={() => window.open(`https://linkedin.com/in/${socials.linkedin}`)}
          icon={<IconBrandLinkedin />}
          size={size}
        />
      )}
      {socials.website && (
        <ActionIconBox
          onClick={() => window.open(socials.website)}
          icon={<IconWorld />}
          size={size}
        />
      )}
    </Group>
  );
}