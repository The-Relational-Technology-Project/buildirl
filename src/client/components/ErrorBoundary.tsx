"use client";

import React from "react";
import { logger } from "../logger";
import { Anchor, Button, Image, Stack, Text } from "@mantine/core";
import AbsoluteCenter from "~/client/components/AbsoluteCenter";

type ErrorBoundaryProps = {
  children: React.ReactNode;
  // undefined = false
  adjustForHeader?: boolean;
};

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  { hasError: boolean }
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error({ error, errorInfo: errorInfo }, "client side error");
  }

  render() {
    if (this.state.hasError) {
      return (
        <AbsoluteCenter adjustForHeader={this.props.adjustForHeader}>
          <Stack align="center" maw={500}>
            <Image
              w={{ base: 100, md: 150 }}
              src={"/images/robot.svg"}
              alt={"robot"}
            />
            <Text size={"lg"} fw={500}>
              Uh oh! Something went wrong!
            </Text>
            <Text ta={"center"}>
              {"Try reloading the page or "}
              <Anchor
                underline={"always"}
                fw={500}
                href={"https://tally.so/r/w5MevP"}
                target={"_blank"}
                c={"black"}
              >
                contact
              </Anchor>
              {" us if the problem persists."}
            </Text>
            <Button onClick={() => window.location.reload()} mt={"sm"}>
              Reload Page
            </Button>
          </Stack>
        </AbsoluteCenter>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
