import { type MainService } from "~/server/service/types";
import { type SystemState } from "./systemState";
import {orderById} from "./utils";

function createVerifiers() {
  async function verifyUser(
    userId: number,
    r: MainService,
    m: SystemState
  ) {
    const user = await r.getUser(userId);
    expect(user).toEqual(m.getUser(userId));
  }

  async function verifyClub(
      clubId: number,
      r: MainService,
      m: SystemState
  ) {
    const expected = m.getClub(clubId);
    // main entity query
    const club = await r.getClub(clubId);
    expect(club).toEqual(expected);
    // also verify query by public id
    const clubByPublicId = await r.getClubByPublicId(expected.publicId);
    expect(clubByPublicId).toEqual(expected);
  }

  async function verifyUserOwnedClub(
    userId: number,
    r: MainService,
    m: SystemState
  ) {
    const userOwnedClubs = await r.getUserOwnedClubs(userId);
    expect(orderById(userOwnedClubs)).toEqual(orderById(m.getUserOwnedClubs(userId)));
  }

  return {
    verifyUser,
    verifyClub,
    verifyUserOwnedClub
  };
}

export const verifiers = createVerifiers();
