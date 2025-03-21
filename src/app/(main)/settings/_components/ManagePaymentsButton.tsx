import { Box, BoxProps, Button } from "@mantine/core";
import React from "react";
import { api } from "~/trpc/react";
import { QueryError } from "~/client/utils/QueryError";
import { isLoaded } from "~/client/utils";

export default function ManagePaymentsButton({ ...props }: BoxProps) {
  const r = api.payments.customerPortalLink.useQuery();

  QueryError.checkNullable({
    result: r,
    fieldName: "customerPortalLink"
  });

  return (
    isLoaded(r) && (
      <Box {...props}>
        <Button component="a" href={r.data!} target="_blank">
          Manage Payments
        </Button>
      </Box>
    )
  );
}
