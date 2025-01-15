import {type Command} from "fast-check";
import {type SystemState} from "../systemState";
import {UpdateUserInput} from "~/server/service/types";
import {type Maybe} from "~/utils/types";
import {verifiers} from "../verifiers";
import {stringify} from "~/utils";
import {MainService} from "~/server/service/types";
import {ItemSelector} from "../utils/itemSelector";

export default class UpdateUserCommand
    implements Command<SystemState, MainService> {
    private readonly input: UpdateUserInput;
    private readonly userIdSelector: ItemSelector<number>;
    private userId: Maybe<number> = null;


    constructor(input: UpdateUserInput, userIdSelector: ItemSelector<number>) {
        this.input = input;
        this.userIdSelector = userIdSelector;
    }

    check(m: Readonly<SystemState>): boolean {
        return m.hasUsers();
    }

    async run(m: SystemState, r: MainService): Promise<void> {
        this.userId = this.userIdSelector.select(m.getUserIds());
        await r.updateUser(
            this.userId,
            this.input
        );
        m.updateUser(this.userId, this.input);
        await verifiers.verifyUser(this.userId, r, m);
    }

    toString() {
        return stringify({
            UpdateUserCommand: {
                input: this.input,
                userId: this.userId,
            }
        });
    }
}
