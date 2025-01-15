import { GenericContainer, type StartedTestContainer } from "testcontainers";
import { rootLogger } from "~/logger";

const logger = rootLogger.child({ module: "supabaseTestContainer" });

export async function createSupabaseTestContainer(): Promise<SupabasePostgresTestContainer> {
  const dbName = "postgres";
  const user = "postgres";
  const password = "postgres";
  const port = 5432;

  const container = await new GenericContainer("supabase/postgres")
    .withExposedPorts(port)
    .withEnvironment({
      POSTGRES_DB: dbName,
      POSTGRES_USER: user,
      POSTGRES_PASSWORD: password
    })
    .withLogConsumer((s) => {
      s.on("data", (e) => {
        logger.info(e);
      });
    })
    .start();

  const connectionString = `postgresql://${user}:${password}@${container.getHost()}:${container.getMappedPort(
    port
  )}/${dbName}`;

  return {
    container: container,
    connectionString: connectionString,
    pooledConnectionString: `${connectionString}?pgbouncer=true`
  };
}

type SupabasePostgresTestContainer = {
  container: StartedTestContainer;
  pooledConnectionString: string;
  connectionString: string;
};
