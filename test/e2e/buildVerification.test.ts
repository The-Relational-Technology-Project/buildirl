import { execSync } from "child_process";
import { rootLogger } from "~/logger";

const logger = rootLogger.child({ module: "buildVerification" });

describe("build verification", () => {
  it("should pass type checking", () => {
    try {
      logger.info("running type check...");
      execSync("yarn run typecheck", { 
        stdio: "inherit",
        cwd: process.cwd()
      });
      logger.info("✅ type check passed!");
    } catch (error) {
      logger.error("❌ type check failed");
      throw error;
    }
  });

  it("should pass system tests", async () => {
    try {
      logger.info("running system tests...");
      execSync("yarn test test/e2e/system.test.ts", { 
        stdio: "inherit",
        cwd: process.cwd()
      });
      logger.info("✅ system tests passed!");
    } catch (error) {
      logger.error("❌ system tests failed");
      throw error;
    }
  }, 600000); // 10 minute timeout to match system test timeout
}); 