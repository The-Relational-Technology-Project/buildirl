import type { Config } from "jest";
import { loadEnvConfig } from "@next/env";
import { pathsToModuleNameMapper } from "ts-jest";
import tsconfig from "./tsconfig.json";

export default async (): Promise<Config> => {
  // injects .env.test variables into jest tests
  const projectDir = process.cwd();
  loadEnvConfig(projectDir);

  return {
    preset: "ts-jest",
    testEnvironment: "node",
    transform: {
      "^.+\\.m?js$": "babel-jest"
    },
    verbose: true,
    moduleNameMapper: pathsToModuleNameMapper(tsconfig.compilerOptions.paths, {
      prefix: "<rootDir>/"
    })
  };
};
