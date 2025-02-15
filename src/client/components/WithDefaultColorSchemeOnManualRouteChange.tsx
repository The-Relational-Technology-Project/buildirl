"use client";

import React, { useEffect, useRef } from "react";
import { useMantineColorScheme } from "@mantine/core";
import { usePathname } from "next/navigation";

// a bit hacky but logic to revert back to default color scheme from join flow (which has club custom theme)
// does not capture the case when user manually enters URL. This hook captures and changes the colorScheme back
// to default in this case
export function WithDefaultColorSchemeOnManualRouteChange({
  children
}: {
  children: React.ReactNode;
}) {
  const { setColorScheme } = useMantineColorScheme();
  const pathname = usePathname();
  const previousPathRef = useRef(pathname);

  useEffect(() => {
    const previousPath = previousPathRef.current;
    const currentPath = pathname;

    console.log("previous:" + previousPath);
    console.log("current: " + currentPath);

    // this captures the case when browser is refreshed or url is
    // changed manually. In those cases, previousPath === currentPath
    if (
      previousPath === currentPath &&
      // set back to light if not in join flow
      !startsWith(currentPath, ["/join", "/apply"])
    ) {
      setColorScheme("light");
    }

    previousPathRef.current = currentPath;
  }, [pathname]);

  return <>{children}</>;
}

function startsWith(s: string, m: string[]) {
  return m.some((m) => s.startsWith(m));
}
