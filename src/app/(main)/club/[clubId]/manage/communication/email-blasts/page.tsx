"use client";

import { useParams } from "next/navigation";
import { Container } from "@mantine/core";
import WithLocalNavigationHeader from "~/client/components/WithLocalNavigationHeader";
import { strictParseInt } from "~/utils";
import EmailBlastListPanel from "../../_components/EmailBlastListPanel";

export default function EmailBlastsPage() {
  const { clubId } = useParams<{ clubId: string }>();
  const clubIdNumber = strictParseInt(clubId);

  return (
    <WithLocalNavigationHeader navigateTo={`/club/${clubId}/manage?tab=email`}>
      <Container size="lg">
        <EmailBlastListPanel clubId={clubIdNumber} />
      </Container>
    </WithLocalNavigationHeader>
  );
}