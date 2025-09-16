import { createSupabaseTestContainer } from "./utils/supabaseTestContainer";
import { PrismaClient } from "@prisma/client";
import { execSync } from "child_process";
import { assert, asyncModelRun, asyncProperty, commands } from "fast-check";
import { type StartedTestContainer } from "testcontainers";
import { SystemState } from "./systemState";
import { allCommands } from "./commands";
import { rootLogger } from "~/logger";
import { createFakeStripeClient } from "./fakeStripeClient";
import { PaymentService } from "~/server/payments/types";
import { createPaymentService } from "~/server/payments/service";
import {
  createPaymentEventProcessor,
  PaymentEventProcessor
} from "~/server/payments/eventProcessor";
import { createAccountIdResolver } from "~/server/payments/accountIdResolver";
import { createDummyEmailClient } from "./dummyEmailClient";
import { EmailService } from "~/server/email/types";
import { createEmailService } from "~/server/email/service";
import { UserService } from "~/server/user/types";
import { ClubService } from "~/server/club/types";
import { MembershipTierService } from "~/server/membershipTier/types";
import { MembershipService } from "~/server/membership/types";
import { createUserService } from "~/server/user/service";
import { createClubService } from "~/server/club/service";
import { createMembershipService } from "~/server/membership/service";
import { createMembershipTierService } from "~/server/membershipTier/service";
import { FollowingService } from "~/server/following/types";
import { createFollowingService } from "~/server/following/service";
import { RoleService } from "~/server/role/types";
import { createRoleService } from "~/server/role/service";
import { MembershipCampaignService } from "~/server/membershipCampaign/types";
import { createMembershipCampaignService } from "~/server/membershipCampaign/service";

export type Services = {
  user: UserService;
  club: ClubService;
  membershipTier: MembershipTierService;
  membership: MembershipService;
  following: FollowingService;
  role: RoleService;
  payment: PaymentService;
  paymentEvents: PaymentEventProcessor;
  email: EmailService;
  membershipCampaign: MembershipCampaignService;
};

function migratePrismaSchema(databaseUrl: string, pooledDatabaseUrl: string) {
  execSync(
    `export POSTGRES_PRISMA_URL=${databaseUrl} POSTGRES_URL=${pooledDatabaseUrl}; 
    yarn prisma migrate dev`,
    { stdio: "inherit" }
  );
}

// TODO run this on gitlab-ci with docker-in-docker set-up
describe("service", () => {
  let container: StartedTestContainer;
  let userService: UserService;
  let clubService: ClubService;
  let membershipTierService: MembershipTierService;
  let membershipService: MembershipService;
  let followingService: FollowingService;
  let roleService: RoleService;
  let paymentService: PaymentService;
  let paymentEventProcessor: PaymentEventProcessor;
  let emailService: EmailService;
  let membershipCampaignService: MembershipCampaignService;

  beforeAll(async () => {
    const supabaseContainer = await createSupabaseTestContainer();
    container = supabaseContainer.container;

    const prisma = new PrismaClient({
      datasources: { db: { url: supabaseContainer.pooledConnectionString } },
      log: ["query", "error", "warn"]
    });

    migratePrismaSchema(
      supabaseContainer.connectionString,
      supabaseContainer.pooledConnectionString
    );

    rootLogger.info("connection string: " + supabaseContainer.connectionString);
    const fakeStripeClient = createFakeStripeClient();
    const accountIdResolver = createAccountIdResolver(prisma);
    const dummyEmailClient = createDummyEmailClient();
    userService = createUserService(prisma);
    paymentService = createPaymentService(
      fakeStripeClient,
      prisma,
      accountIdResolver
    );
    membershipTierService = createMembershipTierService(prisma, paymentService);
    followingService = createFollowingService(prisma, userService);
    roleService = createRoleService(prisma);
    emailService = createEmailService(prisma, dummyEmailClient, userService);
    membershipService = createMembershipService(
      prisma,
      userService,
      membershipTierService,
      followingService,
      roleService,
      emailService,
      paymentService
    );
    clubService = createClubService(
      prisma,
      membershipTierService,
      membershipService
    );
    paymentEventProcessor = createPaymentEventProcessor(
      prisma,
      membershipService,
      paymentService
    );
    membershipCampaignService = createMembershipCampaignService(
      prisma
    );
    // container start ~15 seconds on mli's M1 Macbook;
    // first run may require <5 min for initial image pull
  }, 30000);

  afterAll(async () => {
    if (!container) {
      return;
    }
    await container.stop({ timeout: 60000, remove: true, removeVolumes: true });
  });

  it("should run system", async () => {
    await assert(
      asyncProperty(
        commands(allCommands(), { size: "large" }),
        async (cmds) => {
          const s = () => ({
            model: new SystemState(),
            real: {
              user: userService,
              club: clubService,
              membershipTier: membershipTierService,
              membership: membershipService,
              following: followingService,
              role: roleService,
              payment: paymentService,
              paymentEvents: paymentEventProcessor,
              email: emailService,
              membershipCampaign: membershipCampaignService
            }
          });
          // TODO check that all commands were run at least once
          await asyncModelRun(s, cmds);
        }
      ),
      {
        // shrinking causes issues with global database entities
        endOnFailure: true
      }
    );
  }, 600000);
});
