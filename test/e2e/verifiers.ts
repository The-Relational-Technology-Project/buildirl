import { type MainService } from "~/server/service/types";
import { type SystemState } from "./systemState";

function createVerifiers() {
  async function verifyUser(
    userId: number,
    r: MainService,
    m: SystemState
  ) {
    const user = await r.user(userId);
    expect(user).toEqual(m.getUser(userId));
  }

  async function verifyClub(
      clubId: number,
      r: MainService,
      m: SystemState
  ) {
    const club = await r.club(clubId);
    expect(club).toEqual(m.getClub(clubId));
  }

  return {
    verifyUser,
    verifyClub
  };
}

export const verifiers = createVerifiers();
