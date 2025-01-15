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

  return {
    verifyUser
  };
}

export const verifiers = createVerifiers();
