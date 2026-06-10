// !! PROTOTYPE

import { Icon, IconBulb, IconHeart, IconMoodSmile } from "@tabler/icons-react";

export type CampaignConfiguration = {
  clubPublicId: string;
  membershipTierId: number;

  coverPictureUrl: string;
  subheader: string;
  location: string;
  time: string;
  frequency: string;

  monthlyGoal: number;
  monthlyGoalDisplay: number;
  spendCategories: SpendCategory[];
  targetDate: Date;

  hostSignature: string;
  whoWeAre: string;
  howWeHang: string;
  whyJoinUs: string[];
  pictureUrls: string[];
  values: Value[];

  calendarLink: string;
  calendarEvent: CalendarEvent;

  contactUsEmail: string;
  clubWebsite: string;
};

type SpendCategory = {
  description: string;
  cost: number;
};

type Value = {
  icon: Icon;
  heading: string;
  description: string;
};

type CalendarEvent = {
  title: string;
  description: string;
  date: string;
  time: string;
  imageUrl: string;
  eventLink: string;
};

// Example configuration for the campaign page prototype. Replace with your
// club's content — image paths can be anything served from public/ or a
// public URL.
export const CAMPAIGN_CONFIGURATIONS: CampaignConfiguration[] = [
  {
    clubPublicId: "example-club",
    membershipTierId: 1,
    coverPictureUrl: "/images/buildirl_welcome.webp",
    subheader: "Calling all builders, dreamers and gatherers. ✨",
    location: "Your neighborhood",
    time: "Last Wednesday every month",
    frequency: "Every month",
    monthlyGoal: 400,
    monthlyGoalDisplay: 400,
    spendCategories: [
      { description: "Venue rental 🏠", cost: 250 },
      { description: "Food & snacks 🍕️", cost: 100 },
      { description: "Hosting, materials & fun 💜", cost: 50 }
    ],
    targetDate: new Date("2030-01-01 23:59:59"),
    hostSignature: "Your Club Hosts",
    whoWeAre: `We're a tight-knit crew of neighbors who support each other at every step — gathering regularly, designing for belonging, and co-creating shared resources.

If you're dreaming of starting something in your neighborhood, join us. Let's build IRL together and have a blast while we do it 🥳`,
    howWeHang: `Our monthly member hang is a time to connect, share learnings, celebrate wins, and surface opportunities.

This club is built by members — so you can co-host our meetup, pitch in, bring your ideas or just show up 💛`,
    whyJoinUs: [
      "Monthly meetups 🎉, food & vibes 🍕",
      "Build cool stuff with amazing humans",
      "Member group chat & directory",
      "Playbooks, tools & best practices",
      "Co-create. Co-host. Bring your ideas. 💡"
    ],
    pictureUrls: [
      "/images/good-club.png",
      "/images/you-are-in-hands-clapping.jpeg",
      "/images/purple-with-glasses.png"
    ],
    values: [
      {
        icon: IconBulb,
        heading: "Co-create",
        description: "No spectators — we build this together"
      },
      {
        icon: IconHeart,
        heading: "Mutual Respect",
        description: "Make all feel safe & heard. Above all, be kind️"
      },
      {
        icon: IconMoodSmile,
        heading: "Choose Fun",
        description: "Start a game, crack a joke, it's all fair"
      }
    ],

    calendarLink: "https://example.com/calendar",
    calendarEvent: {
      title: "Monthly Club Gathering",
      description:
        "A monthly hangout for club members and curious neighbors — good food, great discussion, and helpful humans.",
      date: "January 1",
      time: "6-8:00pm",
      imageUrl: "/images/buildirl_login.webp",
      eventLink: "https://example.com/event"
    },

    contactUsEmail: "hello@example.com",
    clubWebsite: "https://example.com"
  }
];
