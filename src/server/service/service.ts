import { type PrismaClient } from "@prisma/client";
import {rootLogger} from "~/logger";

const logger = rootLogger.child({ module: "mainService" });

export function createMainService(
  prisma: PrismaClient
) {

}
