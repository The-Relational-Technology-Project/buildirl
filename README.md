# BuildIRL
This is the tech platform for [BuildIRL](https://www.clubs.buildirl.com/) (est., 2025)! We will supercharge the next generation
of local community builders!

## Project
- [Slack](https://www.buildirl.slack.com)
- [GitLab](https://gitlab.com/smallworld/buildirl)
- [Vercel](https://vercel.com/asmallworld/buildirl)
- [Supabase](https://supabase.com/dashboard/project/zepmgttkkbjigvvvbbce)
- [Stripe](https://dashboard.stripe.com/dashboard)
- [GCP](https://console.cloud.google.com/home/dashboard?invt=AbuU6A&project=buildirl-456321) (for SSO)
- [Posthog](https://us.posthog.com/project/210175)
- [Postmark](https://postmarkapp.com/)

## Technologies

- [Next.js](https://nextjs.org)
- [MantineUI](https://ui.mantine.dev/)
- [tRPC](https://trpc.io)
- [Prisma](https://prisma.io)
- [Supabase](https://supabase.com/docs)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [CASL](https://casl.js.org/v6/en/guide/intro)
- [Stripe](https://docs.stripe.com/billing/subscriptions/overview)

## Running Locally

First time users can use the commands in the [justfile](justfile) in order to run the application locally.
1. Install [docker desktop](https://www.docker.com/get-started/) and make sure it is running
2. Set up the Supabase Postgres image locally:
   ```bash
   # Pull the Supabase Postgres image
   docker pull supabase/postgres:15.1.0.117
   
   # Create a local 'latest' tag for the image
   docker tag supabase/postgres:15.1.0.117 supabase/postgres:latest
   ```
   This step ensures the correct Supabase image is available for the local database.
3. `just setup` for first time set-up of local database and dependencies
4. `just db-start` to bring up db and generate a `.env` from `.env_example`. 
    - Terminal Output -->   .env file
    - `DB URL` -->          `POSTGRES_URL`
    - `DB URL` -->          `POSTGRES_NON_POOLING`
    - `API URL` -->         `NEXT_PUBLIC_SUPABASE_URL`
    - `anon key` -->        `NEXT_PUBLIC_SUPABASE_ANON_KEY`
    - `anon key` -->        `SUPABASE_ANON_KEY`
5. To setup tables in local db, run `yarn db:migrate`. 
6. `just start` to begin local instance. See output for the local port (defaults to `localhost:3000`)
7. Open your local Supabase studio (http://localhost:54323) and enable RLS (row-level security) for all tables and add appropriate policies. See Authorization section below for more details.
8. Open your local Supabase studio (http://localhost:54323) and follow steps in Storage section. 
 
If running Stripe locally:
1. Install and login to [Stripe CLI](https://docs.stripe.com/stripe-cli).
for webhook forwarding. Follow in-prompt instructions and choose Local sandbox environment.
2. Check your Stripe dashboard for the `Secret Key` and the `Publishable Key` and copy to your `.env` file.
3. To get your `Webhook Key`, run `stripe listen --forward-to localhost:3000/api/stripe-webhook` and copy key to your `.env`.
4. If you need to run local Stripe integration, make sure also to run `just stripe-listen` to begin the local listener to 
webhook at `localhost:3000`

### Local Authentication
Authentication requires OTP sent to your email. When running locally, you will not receive an email. Instead you can retrieve 
the messages with Inbucket which is accessible at `localhost:54324`.

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

## Authorization
The source of truth for RBAC/ABAC authorization rules is in CASL abilities applied at trpc layer for API access and Postgres RLS rules
for storage objects. The RLS policies are listed in `prisma.rls.sql`.

### API
1. When a table is added via prisma migration, it is by default not secured via RLS. This means supabase UI clients can access them freely.
**It is important to immediately enable RLS to it as close to possible as the migration is applied in version control** in the following areas:`prisma.rls.sql`, locally (via supabase studio @ `localhost:54323`),
[test](https://supabase.com/dashboard/project/raoharfnfnkuyabregez/auth/policies), and [prod](https://supabase.com/dashboard/project/zepmgttkkbjigvvvbbce/auth/policies).
2. RBAC/ABAC authorization on protected entities are defined via CASL abilities and applied as checks in the trpc layer. Every addition
or change to an API should be audited to see if there are any necessary RBAC/ABAC authorization needed. By default our endpoints are open
to all authenticated users (secured procedures), the public (public procedures), unless explicitly secured.

### Storage
Supabase RLS is the source-of-truth for storage authorization. **When new folder or bucket is created, it is important to add to storage
RLS rules version controlled in (`prisma/rls.sql`) and apply the changes manually via the supabase management console locally 
(via supabase studio @ `localhost:54323`), [test](https://supabase.com/dashboard/project/raoharfnfnkuyabregez/auth/policies), and
[prod](https://supabase.com/dashboard/project/raoharfnfnkuyabregez/storage/policies).**
NOTE: For first-time setup, you should create the 'images' bucket, set to Public and add the policies mentioned above. 

## Integration

We use [trunk-based development](https://www.atlassian.com/continuous-delivery/continuous-integration/trunk-based-development) as our integration strategy. In conjunction with
TDD and smaller commits, this allows for increased iteration speed. We emphasize taking smaller faster steps and reducing
the time your code is diverging from the trunk (testing). For larger commits, a PR should be created and reviewed by others. For small commits, it's okay to get merge into testing. Commits are tracked in the `dev` slack channel.

### CI Workflow
1. Run PBT in `system.test.ts` on any backend changes locally before deployment. Use `yarn run test` to run tests.
2. Merge and push code into `testing` branch which is deployed automatically to the [testing environment](https://clubs-test.buildirl.com/)
3. To deploy prod, create a PR from `origin/testing` into `origin/main`. Updates to the `main` branch is automatically 
deployed to the [production environment](https://clubs.buildirl.com/).

### DB Migrations
1. Apply migrations first locally using `just db-migrate`. This creates migration files (in `prisma/migrations/`) from `schema.prisma` changes
2. Vercel deployments into testing and production environment automatically applies the generated migration files to the [testing](https://supabase.com/dashboard/project/raoharfnfnkuyabregez) 
and [production](https://supabase.com/dashboard/project/zepmgttkkbjigvvvbbce) databases respectively
3. Newly created tables need to be secured in all environments by turning on RLS (see Authorization section). It is ideal to do this
as closely to when the table creation migration is applied.
4. Then use `just generate-prisma`. See [Prisma Generation](https://www.prisma.io/docs/orm/reference/prisma-cli-reference#generate)
5. If trouble still persists, consider spinning down and up the DB with `just db-start` and `just db-stop`. 

## Other Readings

Other optional readings that help inform the development practices are:
1. [Modern Software Development by Dave Farley](https://www.amazon.com/Modern-Software-Engineering-Discipline-Development/dp/0137314914)
2. [DORA metrics](https://cloud.google.com/blog/products/devops-sre/using-the-four-keys-to-measure-your-devops-performance)

## AI Development Workflow

We encourage leveraging AI tools in our development practices. It is a way we can achieve scale as a lean team and keep up skill
development as engineers. The team has used a combination Claude Code (in agent mode) and prior usage of Cursor copilot.

### Tips

Getting the best results from AI tool use requires a combination of specific prompts, managing context, and understanding the 
optimal level (feature) at which to iterate with the AI. We should use trial and error and learn best practices as a team. 

Some use cases which it performs well in are:
- design brainstorming
- initial first-pass feature implementation
- rapid prototypes for short-lived experimental features (we do not care about long-term code quality)
- full implementation when there are many good examples in the codebase already (e.g. implement auth layer, implement this API)

### Caveats

We use AI as a tool to empower human-in-the-loop development not to replace it. Above all we should follow good code development 
practices. Code should be reviewed and understood by the committer and held to the same code quality 
and standards as human written code. In addition, you should continue to maintain your full understanding of the code. 
Not doing so adds to technical and knowledge debt which will be a risk in the long-term.

#### Key Files

- The `CLAUDE.md`  contains AI-facing documentation for Claude Code agentic mode.
- The `.cursor/rules/` directory contains AI-facing documentation for Cursor copilot.
- `docs/ai-reference/software_principles.md` - Software engineering principles reference for AI-assisted development. This can be passed into the AI for additional context.
- `docs/ai-reference/team-software_principles.md` - Team specific software engineering principles reference for AI-assisted development. This can be passed into the AI for additional context.

The [docs/ai-reference/team_software_principles.md](docs/ai-reference/team_software_principles.md) also serves as a documentation for team best practices. It is encouraged you read
this document prior to development to understand some team coding principles.

## Deployments

We use Vercel for deployment which can be followed using this [guide](https://create.t3.gg/en/deployment/vercel).

## Experimentation and Prototypes

To get faster feedback, we're shifting toward experimental development practices (operating in "prototype mode" rather than "production mode"). 
This approach emphasizes rapid hypothesis testing — prioritizing quick validation over long-term maintainability. We assume prototype code 
is temporary and will be discarded or rebuilt once testing is complete. Use prototype mode for high-risk, non-core features. When adding experimental code 
to the main application, mark it with `!! PROTOTYPE` to ensure proper cleanup or refactoring post-test.