# BuildIRL

This is the tech platform for [BuildIRL](https://www.buildirl.com/) (est., 2025)! We will supercharge the next generation
of local community builders!

## Project

- [Slack](https://www.buildirl.slack.com)
- [GitLab](https://gitlab.com/smallworld/buildirl)
- [Vercel](https://vercel.com/asmallworld/buildirl)
- [Supabase](https://supabase.com/dashboard/project/raoharfnfnkuyabregez)

## Technologies

- [Next.js](https://nextjs.org)
- [ChakraUI](https://v2.chakra-ui.com/getting-started)
- [tRPC](https://trpc.io)
- [Prisma](https://prisma.io)
- [Supabase](https://supabase.com/docs)
- [Supabase Auth](https://supabase.com/docs/guides/auth)

## Running Locally

First time users can use the commands in the [justfile](justfile) in order to run the application locally.

1. `just setup` for first time set-up of local database and dependencies
2. `just db-start` and `just start` to begin local instance. See output for the localport (defaults to localhost:3000)

## Testing

We follow [TDD](https://martinfowler.com/bliki/TestDrivenDevelopment.html) to ensure confidence in our development and
deployments. We use property-based testing via [fastcheck](https://fast-check.dev/docs/introduction/) whenever possible
for server-side coverage. For remote-calls, we prefer [fakes over mocks](https://tyrrrz.me/blog/fakes-over-mocks) to better
replicate production environment.

## Observability

We use [pino](https://getpino.io/#/) logging as a lightweight o11y solution. In general, for each server function, we want
coverage on:

1. Normal workflow execution (under `INFO` level), at least 1 on root level per serverless function call
2. Failures and exception messages (under `ERROR` level)
3. Additional metadata (e.g., input and response objects) or warnings that might be useful

## Integration

We use [trunk-based development](https://trunkbaseddevelopment.com/) as our integration strategy. In conjunction with
TDD and smaller commits, this allows for increased iteration speed. We emphasize taking smaller faster steps and reducing
the time your code is divergent from main.

## Other Readings

Other optional readings that help inform the development practices are:

1. [Modern Software Development by Dave Farley](https://www.amazon.com/Modern-Software-Engineering-Discipline-Development/dp/0137314914)
2. [DORA metrics](https://cloud.google.com/blog/products/devops-sre/using-the-four-keys-to-measure-your-devops-performance)

## Deployments

We use Vercel for deployment which can be followed using this [guide](https://create.t3.gg/en/deployment/vercel)
