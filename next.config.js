/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  // TODO! remove once the irlbuildersclub campaign is over
  async redirects() {
    return [
      // Basic redirect
      {
        source: "/campaign/irlbuildersclub/72",
        destination: "/campaign/irlbuildersclub",
        permanent: true
      }
    ];
  }
};

export default config;
