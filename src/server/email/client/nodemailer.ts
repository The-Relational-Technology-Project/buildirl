import nodemailer from "nodemailer";
import postmarkTransport from "nodemailer-postmark-transport";
import { env } from "~/env";

export const mailTransport = nodemailer.createTransport(
  postmarkTransport({
    auth: {
      apiKey: env.POSTMARK_SERVER_API_TOKEN
    }
  })
);
