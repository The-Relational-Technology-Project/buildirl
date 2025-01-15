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
    const expected = m.getClub(clubId);
    // main entity query
    const club = await r.club(clubId);
    expect(club).toEqual(expected);
    // also verify query by public id
    const clubByPublicId = await r.clubByPublicId(expected.publicId);
    expect(clubByPublicId).toEqual(expected);
  }

  return {
    verifyUser,
    verifyClub
  };
}

export const verifiers = createVerifiers();
