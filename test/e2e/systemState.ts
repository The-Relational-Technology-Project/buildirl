import {
  type User,
} from "~/server/service/types";
export class SystemState {
  private users: Map<number, User>;

  constructor() {
    this.users = new Map();
  }

  public getUser(id: number): User {
    const user = this.users.get(id);
    if (!user) {
      throw new Error(`user with id ${id} was expected`);
    }
    return user;
  }

  public createUser(user: User) {
    if (!!this.users.get(user.id)) {
      throw new Error(`user with id ${user.id} already exists`)
    }
    this.users.set(user.id, user);
  }
}
