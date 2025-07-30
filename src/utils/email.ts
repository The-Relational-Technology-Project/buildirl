import { EmailTemplateType } from "~/server/email/types";
import { EmailVariable } from "~/client/components/EmailVariableDoc";

export type EmailContent = {
  subject: string;
  htmlContent: string;
  textContent: string;
};

export type EmailVariables = {
  clubName: string;
  memberFirstName: string;
  memberLastName?: string;
  joinPageUrl?: string;
};

export const DEFAULT_EMAIL_TEMPLATES: Record<EmailTemplateType, EmailContent> = {
  ACCEPTANCE: {
    subject: "You're in! Welcome to {{clubName}}! 🎉",
    textContent: `Hey {{memberFirstName}} — amazing news: you're officially a member of {{clubName}}! 🎉

We're hyped to have you! 🥳

👉 Click here to see more! {{joinPageUrl}}`,
    htmlContent: `
      <div>
        <p>Hey <strong>{{memberFirstName}}</strong> — amazing news: you're officially a member of <strong>{{clubName}}</strong>! 🎉</p>
        <p>We're hyped to have you! 🥳</p>
        <p>👉 <a href="{{joinPageUrl}}">Click here to see more!</a></p>
      </div>
    `
  },
  
  REJECTION: {
    subject: "Sorry, your application was not accepted this time",
    textContent: `Hey {{memberFirstName}} — thanks for applying to the {{clubName}}. 
We couldn't accept your application this time. 💌 Plenty more clubs to explore — go find your people.
P.S. If you shared payment info, no worries — you won't be charged.`,
    htmlContent: `
      <div>
        <p>Hey <strong>{{memberFirstName}}</strong> — thanks for applying to the <strong>{{clubName}}</strong>.</p>
        <p>We couldn't accept your application this time. 💌 Plenty more clubs to explore — go find your people.</p>
        <p>P.S. If you shared payment info, no worries — you won't be charged.</p>
      </div>
    `
  },
  
  DEPARTURE: {
    subject: "Sorry to see you go! 👋",
    textContent: `The {{clubName}} will miss you, {{memberFirstName}} {{memberLastName}}! 
Thank-you for being a contributing member! 🙏`,
    htmlContent: `
      <div>
        <p>The <strong>{{clubName}}</strong> will miss you, {{memberFirstName}} {{memberLastName}}!</p>
        <p>Thank-you for being a contributing member! 🙏</p>
      </div>
    `
  }
};

/**
 * Interpolates template variables in email content
 */
export function interpolateEmail(
  template: EmailContent,
  variables: EmailVariables
): EmailContent {
  const interpolate = (text: string): string => {
    return Object.entries(variables).reduce((result, [key, value]) => {
      const placeholder = `{{${key}}}`;
      return result.replace(new RegExp(placeholder, 'g'), value || '');
    }, text);
  };

  return {
    subject: interpolate(template.subject),
    htmlContent: interpolate(template.htmlContent),
    textContent: interpolate(template.textContent)
  };
}

/**
 * Gets the default template for a given email template type
 */
export function getDefaultEmailTemplate(type: EmailTemplateType): EmailContent {
  return DEFAULT_EMAIL_TEMPLATES[type];
}

export function getEmailTemplateVariables(templateType: EmailTemplateType): EmailVariable[] {
  const baseVariables: EmailVariable[] = [
    {
      name: "clubName",
      description: "The name of your club"
    },
    {
      name: "memberFirstName", 
      description: "The member's first name"
    },
    {
      name: "memberLastName",
      description: "The member's last name",
      required: false
    }
  ];

  // ACCEPTANCE template gets the additional joinPageUrl variable
  if (templateType === "ACCEPTANCE") {
    return [
      ...baseVariables,
      {
        name: "joinPageUrl",
        description: "Link to your club's join page for the member to access"
      }
    ];
  }

  return baseVariables;
}

export function getEmailBlastVariables(): EmailVariable[] {
  return [
    {
      name: "clubName",
      description: "The name of your club"
    },
    {
      name: "memberFirstName",
      description: "The member's first name"
    },
    {
      name: "memberLastName", 
      description: "The member's last name",
      required: false
    }
  ];
}