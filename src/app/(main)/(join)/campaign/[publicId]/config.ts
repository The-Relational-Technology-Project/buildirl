// !! PROTOTYPE

import {
  Icon,
  IconBolt,
  IconBulb,
  IconHandStop,
  IconHeart,
  IconHeartHandshake,
  IconMoodSmile,
  IconScale,
  IconTarget
} from "@tabler/icons-react";

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

export const CAMPAIGN_CONFIGURATIONS: CampaignConfiguration[] = [
  {
    clubPublicId: "irlbuildersclub",
    membershipTierId: 72,
    coverPictureUrl:
      "https://substackcdn.com/image/fetch/$s_!1xnT!,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F391b4112-0684-42b8-9d26-816403ff7d05_6000x4000.jpeg",
    subheader: "Calling all IRL builders, dreamers and gatherers in SF. ✨",
    location: "SF Commons",
    time: "Last Wednesday every month",
    frequency: "Every month",
    monthlyGoal: 440,
    monthlyGoalDisplay: 440,
    spendCategories: [
      { description: "Epic venue rental 🏠", cost: 300 },
      { description: "Food & snacks 🍕️", cost: 100 },
      { description: "Hosting, materials & fun 💜", cost: 40 }
    ],
    targetDate: new Date("2025-08-20 23:59:59"),
    hostSignature: "Saum, Colt, & Mike",
    whoWeAre: `Building a club? Join the club! Running an IRL club is hard. Don’t do it alone.

We’re a tight-knit crew of club builders who support each other at every step — launching and growing clubs, designing for belonging, and co-creating shared resources like IRL spaces, funds, and playbooks.

We’ve hosted 300 person club fairs, expert workshops, epic dinner discussions and more.

If you’re hosting meetups, events, or dreaming of starting something IRL in SF. Join us. Let’s build IRL together and have a blast while we do it 🥳 😝
`,
    howWeHang: `Our monthly member hang is a time to connect, share learnings, celebrate wins, and surface opportunities. Think music, bites, great discussion, inspiration, helpful hacks and great humans. 
                 
                  This club is built by members — so you can co-host our meetup, pitch in, bring your ideas or just show up 💛`,
    whyJoinUs: [
      "Monthly meetups 🎉, food & vibes 🍕",
      "Build cool stuff with amazing humans",
      "Member WhatsApp group & directory",
      "Playbooks, tools & best practices",
      "Venue hookups & sponsor deals",
      "Co-create. Co-host. Bring your ideas. 💡"
    ],
    pictureUrls: [
      "https://images.squarespace-cdn.com/content/v1/65e40100471cd325b28cb39f/4916135d-e91c-41c4-8f1f-a4a1d25f4e84/PXL_20240628_033612718.MP.jpg?format=1500w",
      "https://zepmgttkkbjigvvvbbce.supabase.co/storage/v1/object/public/images/club/77/display/PXL_20250309_015210568.jpg",
      "https://images.squarespace-cdn.com/content/v1/65e40100471cd325b28cb39f/9f50ef2b-02e8-46ec-9834-e18338327dd3/20240608_102853.jpg?format=1500w",
      "https://media.licdn.com/dms/image/v2/D5622AQHEzlugNXNCgQ/feedshare-shrink_2048_1536/B56ZahjCrRGkAw-/0/1746467042433?e=1756339200&v=beta&t=Xpv2A5Gd7xa-6whB86oIhxduKTP248ywIKd-EJxd9B4"
    ],
    values: [
      {
        icon: IconBulb,
        heading: "Co-create",
        description: "No spectators — we build this together"
      },
      {
        icon: IconBolt,
        heading: "Be Real",
        description: "Be you. Share wild ideas, fails & wins"
      },
      {
        icon: IconHeart,
        heading: "Mutual Respect",
        description: "Make all feel safe & heard. Above all, be kind️"
      },
      {
        icon: IconHandStop,
        heading: "Show Up",
        description: "Be present & lift each other up"
      },
      {
        icon: IconMoodSmile,
        heading: "Choose Fun",
        description: "Start a game, crack a joke, it's all fair"
      }
    ],

    calendarLink: "https://lu.ma/buildirl?k=c",
    calendarEvent: {
      title: "IRL Builders Club Monthly Gathering",
      description:
        "A monthly hangout for the doers shaping SF’s IRL scene—club leaders, community starters, and creators of all kinds.",
      date: "August 27",
      time: "6-8:00pm",
      imageUrl:
        "https://images.lumacdn.com/cdn-cgi/image/format=auto,fit=cover,dpr=2,background=white,quality=75,width=400,height=400/event-covers/9z/f4f4be12-4a25-4e4e-86af-052c065ff230.png",
      eventLink: "https://lu.ma/rdz9hna5?tk=ZNNnNb"
    },

    contactUsEmail: "team@buildirl.com"
  },
  {
    clubPublicId: "bridges",
    membershipTierId: 169,
    coverPictureUrl:
      "https://login.buildirl.com/storage/v1/object/public/images/campaigns/bridges/burgundy-solid.png",
    subheader: "Calling all the ambitious women in the Bay Area",
    location: "SF, East Bay, South Bay",
    time: "3x per month",
    frequency: "3x per month",
    monthlyGoal: 300,
    monthlyGoalDisplay: 500,
    spendCategories: [
      {
        description: "Venue Space",
        cost: 200
      },
      {
        description: "Snacks and Beverages",
        cost: 100
      },
      {
        description: "Operating Costs",
        cost: 200
      }
    ],
    targetDate: new Date("2025-10-08 23:59:59"),
    hostSignature: "Bella Malvini",
    whoWeAre:
      "At Bridges Social Club, we are dedicated to fostering a vibrant and inclusive community for professional women in the San Francisco Bay Area. Through thoughtfully curated events, innovative networking, and a collective dedication to empowering one another, we bridge the gap between ambition and opportunity.\n\nWe are cultivating a network where every woman feels valued, heard, and empowered to succeed. Our mission is to create meaningful connections, inspire growth, and provide a space where women can support, collaborate, and thrive—both personally and professionally.",
    howWeHang:
      "Our events consist of the following 3 types of formats:\n\nFormal Events (Think Panels, Professional Settings, Happy Hours)\nCommunity Events (Hot Girl Walks, Co-working Sessions, Hang Outs)\nLearning and Development Events ( Resume Building Workshops, Office Hours, etc)",
    whyJoinUs: [
      "Access to the private community Slack",
      "Online membership onboarding session",
      "AMAs w/ industry leaders and members",
      "Priority access to limited events",
      "Early access to our resource hub",
      "Member highlight in newsletter, socials"
    ],
    pictureUrls: [
      "https://login.buildirl.com/storage/v1/object/public/images/campaigns/bridges/_MG_1508.jpg",
      "https://login.buildirl.com/storage/v1/object/public/images/campaigns/bridges/_MG_1584.jpg",
      "https://login.buildirl.com/storage/v1/object/public/images/campaigns/bridges/_MG_1717.jpg",
      "https://login.buildirl.com/storage/v1/object/public/images/campaigns/bridges/_MG_1936.jpg"
    ],
    values: [
      {
        icon: IconHeartHandshake,
        heading: "Respect",
        description:
          "Treat others in professional manner and respect the autonomy of others."
      },
      {
        icon: IconScale,
        heading: "Integrity",
        description:
          "We make our decisions based on what benefits the network as a whole."
      },
      {
        icon: IconTarget,
        heading: "Purpose Driven",
        description:
          "We approach interactions with active participation and clear purpose."
      }
    ],
    calendarLink: "https://luma.com/user/BridgesSF",
    calendarEvent: {
      title: "Coworking Day!",
      description:
        "Join us for our Coworking Coffee Day. We'll gather at a local coffee shop to enjoy good vibes, casual conversation, and a few hours of working alongside one another.",
      date: "October 17th",
      time: "9am-12pm",
      imageUrl:
        "https://images.lumacdn.com/cdn-cgi/image/format=auto,fit=cover,dpr=2,background=white,quality=75,width=400,height=400/gallery-images/jy/9ddd9608-048c-4de8-88fa-9dbbb0b449c6",
      eventLink: "https://luma.com/4hfxjkx6"
    },
    contactUsEmail: "bridgessocialclubsf@gmail.com"
  }
];
