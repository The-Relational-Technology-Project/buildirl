import { TemplateTheme } from "~/client/theme/templates";
import React from "react";
import { Maybe } from "~/utils/types";
import { Box, MantineProvider } from "@mantine/core";
import { theme as baseTheme } from "~/client/theme/theme";

type WithTemplateThemeProps = {
  children: React.ReactNode;
  theme: Maybe<TemplateTheme>;
};

export default function WithTemplateTheme({
  children,
  theme: templateTheme
}: WithTemplateThemeProps) {
  if (null === templateTheme) {
    return children;
  }

  const joinThemeRootId = "join-theme-root";

  return (
    <MantineProvider
      theme={baseTheme}
      forceColorScheme={templateTheme.isDark ? "dark" : "light"}
      cssVariablesSelector={`#${joinThemeRootId}`}
      getRootElement={() =>
        typeof document === "undefined"
          ? undefined
          : document.getElementById(joinThemeRootId) ?? undefined
      }
    >
      <Box id={joinThemeRootId} pos="relative" w={"100%"} h={"100%"}>
        <Box
          w={"100%"}
          h={"100%"}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            zIndex: -999,
            backgroundImage: templateTheme.backgroundFileName
              ? `url(/templates/background/${templateTheme.isDark ? "dark/" : "light/"}${templateTheme.backgroundFileName})`
              : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center"
          }}
        />
        {children}
      </Box>
    </MantineProvider>
  );
}
