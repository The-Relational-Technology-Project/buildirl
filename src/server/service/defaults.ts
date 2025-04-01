import { FormQuestions, FormQuestionType } from "~/server/service/types/form";

export const DEFAULT_FREE_MEMBERSHIP_TIER = {
  name: "The Club Crew",
  benefitDescription:
    "Weekly meetups and events, members-only WhatsApp / Slack group, awesome local deals, and a whole lot of " +
    "opportunities to create with fellow members!",
  contributionDescription:
    "We're member-first and member-led. Help us keep the good vibes going by co-hosting, volunteering, or just chipping " +
    "in where you can. Your dues go towards venues, snacks, and more. Your support is what makes this stay alive!",
  costPerMonthInUSD: 0
};

export const DEFAULT_APPLICATION_QUESTIONS: FormQuestions = {
  questions: [
    {
      question: "What is drawing you most to joining our club? 🤔✨",
      type: FormQuestionType.LONG_TEXT
    },
    {
      question:
        "If you were hosting an event for the club, what would you dream up? 🎉💭",
      type: FormQuestionType.LONG_TEXT
    },
    {
      question:
        "Get personal – we'd love to get to know you. What's something sweet, unexpected, delightful, or lovely about you that you'd like to share with us? 💖🌟",
      type: FormQuestionType.LONG_TEXT
    },
    {
      question:
        "What's your go-to snack when you're in the middle of a Netflix binge?",
      type: FormQuestionType.SINGLE_SELECT,
      metadata: {
        choices: [
          "Popcorn all the way! 🍿",
          "Chips and salsa for life 🌶️",
          "Chocolate, duh 🍫",
          "Fruit and yogurt, keeping it fresh 🍓"
        ]
      }
    }
  ]
};
