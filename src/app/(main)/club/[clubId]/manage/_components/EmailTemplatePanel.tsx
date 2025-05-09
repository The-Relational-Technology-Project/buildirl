import React from "react";

type EmailTemplatePanelProps = {
  clubId: number;
};

export function EmailTemplatePanel({ clubId }: EmailTemplatePanelProps) {
  return <>{clubId}</>;
}
