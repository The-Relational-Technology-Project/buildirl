/* eslint-disable @typescript-eslint/no-explicit-any */

import { rootLogger } from "~/logger";
import { showNotification } from "@mantine/notifications";
import { TRPCClientErrorLike } from "@trpc/client";

export const logger = rootLogger.child({ module: "client" });

export function notifyError(message: string = "There was an error.") {
  showNotification({
    title: "Error",
    message: message,
    color: "red",
    autoClose: 3000
  });
}

export function handleDefaultMutationError(error: TRPCClientErrorLike<any>) {
  logger.error(error, "mutation failed");
  notifyError(error.message);
}
