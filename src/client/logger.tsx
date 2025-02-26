import { rootLogger } from "~/logger";
import { showNotification } from "@mantine/notifications";
import { IconExclamationCircle } from "@tabler/icons-react";

export const logger = rootLogger.child({ module: "client" });

export function notifyError(
  userFriendlyMessage: string = "There was an error."
) {
  showNotification({
    title: "Error",
    message: userFriendlyMessage,
    color: "red",
    icon: <IconExclamationCircle size={"1.1rem"} />,
    autoClose: 3000
  });
}
