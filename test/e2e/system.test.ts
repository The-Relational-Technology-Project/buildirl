import { createSupabaseTestContainer } from "./utils/supabaseTestContainer";
import { PrismaClient } from "@prisma/client";
import { execSync } from "child_process";
import { assert, asyncModelRun, asyncProperty, commands } from "fast-check";
import { type StartedTestContainer } from "testcontainers";
import { SystemState } from "./systemState";
import { allCommands } from "./commands";
import { rootLogger } from "~/logger";
import { MainService } from "~/server/service/types";
import { createMainService } from "~/server/service/service";
import { createFakeStripeClient } from "./fakeStripeClient";
import { PaymentService } from "~/server/payments/types";
import { createPaymentService } from "~/server/payments/service";

export type Services = {
  main: MainService;
  payment: PaymentService;
};

function migratePrismaSchema(databaseUrl: string, pooledDatabaseUrl: string) {
  execSync(
    `export POSTGRES_PRISMA_URL=${databaseUrl} POSTGRES_URL=${pooledDatabaseUrl}; 
    yarn prisma migrate dev`,
    { stdio: "inherit" }
  );
}

// TODO run this on gitlab-ci with docker-in-docker set-up
describe("mainService", () => {
  let container: StartedTestContainer;
  let mainService: MainService;
  let paymentService: PaymentService;

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
    mainService = createMainService(prisma, fakeStripeClient);
    paymentService = createPaymentService(
      fakeStripeClient,
      prisma,
      "https://stripe.com/customer-portal"
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
        commands(allCommands(), { size: "medium" }),
        async (cmds) => {
          const s = () => ({
            model: new SystemState(),
            real: { main: mainService, payment: paymentService }
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
