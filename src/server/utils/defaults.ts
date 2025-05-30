import { FormQuestions, FormQuestionType } from "~/server/club/types/form";

export const DEFAULT_FREE_MEMBERSHIP_TIER = {
  name: "The Club Crew",
  benefitDescription:
    "Weekly meetups (rain or shine), member-only whatsapp, IRL hangs, and sweet local perks.",
  contributionDescription:
    "We're member-led — so co-host, pitch in, or just show up. Your dues cover venues, snacks, and all the magic-making essentials. 💛",
  costPerMonthInUSD: 0,
  initiationFeeCostInUSD: null
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
