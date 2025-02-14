import { TemplateTheme } from "~/client/theme/templates";
import React, { useEffect } from "react";
import { Maybe } from "~/utils/types";
import { Box, useMantineColorScheme } from "@mantine/core";
import { Global } from "@mantine/emotion";

type WithTemplateThemeProps = {
  children: React.ReactNode;
  theme: Maybe<TemplateTheme>;
};

// TODO we use emotion because it's simple way to modify the global.css
//  However, usage of emotion is tech debt because of performance and robust concerns with SSR.
//  @mantine/emotion is also deprecated as of V7
export function WithTemplateTheme({ children, theme }: WithTemplateThemeProps) {
  if (null === theme) {
    return children;
  }

  // set color scheme based on if theme `isDark`
  const { setColorScheme, clearColorScheme } = useMantineColorScheme();
  useEffect(() => {
    setColorScheme(theme.isDark ? "dark" : "light");
    return () => {
      // revert to default color scheme
      setColorScheme("auto");
    };
  }, [setColorScheme, clearColorScheme]);

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
