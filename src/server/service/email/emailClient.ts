import { Transporter, TransportOptions } from "nodemailer";
import { 
    EmailClient,
    NotifyMembershipAcceptedInput,
    NotifyMembershipDeclinedInput,
    NotifyMembershipCanceledByMemberInput,
    NotifyMembershipCanceledByOwnerInput
} from "./types";
import { Email } from "../types";
import { rootLogger } from "~/logger";

const logger = rootLogger.child({ module: "emailClient" });

export function createEmailClient(mailTransport: Transporter<any, TransportOptions>): EmailClient {
    
    async function notifyMembershipAcceptance(input: NotifyMembershipAcceptedInput, sendTo: Email): Promise<void> {
       throw new Error("not implemented");
    }
    
    async function notifyMembershipDecline(input: NotifyMembershipDeclinedInput, sendTo: Email): Promise<void> {
        throw new Error("not implemented");
    }
    
    async function notifyMembershipCancelByMember(input: NotifyMembershipCanceledByMemberInput, sendTo: Email): Promise<void> {
        throw new Error("not implemented");
    }
    
    async function notifyMembershipCancelByOwner(input: NotifyMembershipCanceledByOwnerInput, sendTo: Email): Promise<void> {
        throw new Error("not implemented");
    }

    return {
        notifyMembershipAccepted: notifyMembershipAcceptance,
        notifyMembershipDeclined: notifyMembershipDecline,
        notifyMembershipCanceledByMember: notifyMembershipCancelByMember,
        notifyMembershipCanceledByOwner: notifyMembershipCancelByOwner
    };
}