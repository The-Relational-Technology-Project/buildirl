import { Command } from "fast-check";
import { Services } from "../system.test";
import { SystemState } from "../systemState";
import { FAQs, UpdateClubFAQsInput } from "~/server/service/types";
import { ItemSelector } from "../utils/itemSelector";

export default class UpdateClubFAQsCommand
  implements Command<SystemState, Services>
{
  readonly input: UpdateClubFAQsInput;
  readonly clubIdSelector: ItemSelector<number>;

  constructor(input: UpdateClubFAQsInput, clubIdSelector: ItemSelector<number>) {
    this.input = input;
    this.clubIdSelector = clubIdSelector;
  }

  check(s: SystemState): boolean {
    return s.hasClubs(); // If there are clubs, we can try to select one
  }

  async run(s: SystemState, r: Services): Promise<void> {
    const clubId = this.clubIdSelector.select(s.getClubIds());
    
    // Update the real system
    await r.main.updateClubFAQs(clubId, this.input);
    
    // Update the model
    s.updateClubFAQs(clubId, this.input);
  }

  toString(): string {
    return `updateClubFAQs: ${JSON.stringify(this.input)}`;
  }
} 