"use client";

import { IconDownload } from "@tabler/icons-react";
import { mkConfig, generateCsv, download } from "export-to-csv";
import { Membership } from "~/server/membership/types";
import { billingIntervalLabel } from "~/client/utils";
import ColorSchemeAwareActionIcon from "~/client/components/ColorSchemeAwareActionIcon";

interface MembershipExportButton {
  membership: Membership[];
  filename: string;
}

export function MembershipExportButton({
  membership,
  filename
}: MembershipExportButton) {
  const data = membership.map((m: Membership) => ({
    user: `${m.user.firstName} ${m.user.lastName}`,
    tier: m.membershipTier.name,
    contribution: `$${m.membershipTier.costPerBillingInterval}.00/${billingIntervalLabel(m.membershipTier.billingInterval)}`,
    role: m.role,
    email: m.email || ""
  }));

  const csvConfig = mkConfig({
    columnHeaders: [
      { key: "user", displayLabel: "User" },
      { key: "tier", displayLabel: "Tier" },
      { key: "contribution", displayLabel: "Contribution" },
      { key: "dateApplied", displayLabel: "Date Applied" },
      { key: "email", displayLabel: "Email" }
    ],
    filename,
    showTitle: false,
    showColumnHeaders: true,
    useTextFile: false,
    useBom: true
  });

  const handleExport = () => {
    if (!data || data.length === 0) {
      return;
    }
    const csv = generateCsv(csvConfig)(data);
    download(csvConfig)(csv);
  };

  return (
    <ColorSchemeAwareActionIcon
      onClick={handleExport}
      disabled={!data || data.length === 0}
    >
      <IconDownload size={18} />
    </ColorSchemeAwareActionIcon>
  );
}
