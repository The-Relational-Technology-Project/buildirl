import { TemplateTheme } from "~/client/theme/templates";
import React from "react";
import { Maybe } from "~/utils/types";
import { Box } from "@mantine/core";
import { Global } from "@mantine/emotion";

type WithThemeBackgroundProps = {
  children: React.ReactNode;
  theme: Maybe<TemplateTheme>;
};

// TODO we use emotion because it's simple way to modify the global.css
//  However, usage of emotion is tech debt because of performance and robust concerns with SSR.
//  @mantine/emotion is also deprecated as of V7
export function WithThemeBackground({
  children,
  theme
}: WithThemeBackgroundProps) {
  if (null === theme) {
    return children;
  }

  return (
    <Box>
      <Global
        styles={{
          body: {
            backgroundImage: theme.backgroundFileName
              ? `url(/templates/background/${theme.backgroundFileName})`
              : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center"
          }
        }}
      />
      {children}
    </Box>
  );
}
