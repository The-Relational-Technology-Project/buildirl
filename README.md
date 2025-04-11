
# BuildIRL
This is the tech platform for [BuildIRL](https://www.clubs.buildirl.com/) (est., 2025)! We will supercharge the next generation
of local community builders!

## Project
- [Slack](https://www.buildirl.slack.com)
- [GitLab](https://gitlab.com/smallworld/buildirl)
- [Vercel](https://vercel.com/asmallworld/buildirl)
- [Supabase](https://supabase.com/dashboard/project/zepmgttkkbjigvvvbbce)

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
2. `just setup` for first time set-up of local database and dependencies
3. `just db-start` to bring up db and generate a `.env` from `.env_example`. 
    - Terminal Output --> .env file
    - DB URL -->          POSTGRES_URL
    - DB URL -->          POSTGRES_NON_POOLING 
    - API URL -->         NEXT_PUBLIC_SUPABASE_URL
    - anon key -->        NEXT_PUBLIC_SUPABASE_ANON_KEY
    - anon key -->        SUPABASE_ANON_KEY 
4. To setup tables in local db, run `yarn db:migrate`. 
5. `just start` to begin local instance. See output for the localport (defaults to `localhost:3000`)

If running Stripe locally:
1. Install and login to [Stripe CLI](https://docs.stripe.com/stripe-cli) and [preview plugin](https://docs.stripe.com/cli-preview-plugin)
for webhook forwarding. Follow in-prompt instructions and choose Local sandbox environment.
2. If you need to run local Stripe integration, make sure also to run `just stripe-listen` to begin the local listener to 
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
for storage objects.

### API
1. When a table is added via prisma migration, it is by default not secured via RLS. This means supabase UI clients can access them freely.
It is important to immediately enable RLS to it as close to possible as the migration is applied in version control (`prisma.rls.sql`), locally (via supabase studio @ `localhost:54323`),
[test](https://supabase.com/dashboard/project/raoharfnfnkuyabregez/auth/policies), and [prod](https://supabase.com/dashboard/project/zepmgttkkbjigvvvbbce/auth/policies).
2. RBAC/ABAC authorization on protected entities are defined via CASL abilities and applied as checks in the trpc layer. Every addition
or change to an API must be audited to see if there are any necessary RBAC/ABAC authorization needed. By default our endpoints are open
to all authenticated users (secured procedures), the public (public procedures), unless explicitly secured.

### Storage
Supabase RLS is the source-of-truth for storage authorization. When new folder or bucket is created, it is important to add to storage
RLS rules version controlled in (`prisma/rls.sql`) and apply the changes manually via the supabase management console locally 
(via supabase studio @ `localhost:54323`), [test](https://supabase.com/dashboard/project/raoharfnfnkuyabregez/auth/policies), and
[prod](https://supabase.com/dashboard/project/raoharfnfnkuyabregez/storage/policies).

## Integration

We use [trunk-based development](https://trunkbaseddevelopment.com/) as our integration strategy. In conjunction with
TDD and smaller commits, this allows for increased iteration speed. We emphasize taking smaller faster steps and reducing
the time your code is divergent from main.

### CI Workflow
1. Run PBT in `system.test.ts` on any backend changes locally before deployment
2. Merge and push code into `testing` branch which is deployed automatically to the [testing environment](https://clubs-test.buildirl.com/)
3. To deploy prod, run `just deploy-prod` which merges `origin/testing` into `origin/main`. Updates to the `main` branch is automatically 
deployed to the [production environment](https://clubs.buildirl.com/).

### DB Migrations
1. Apply migrations first locally using `just db-migrate`. This creates migration files (in `prisma/migrations/`) from `schema.prisma` changes
2. Vercel deployments into testing and production environment automatically applies the generated migration files to the [testing](https://supabase.com/dashboard/project/raoharfnfnkuyabregez) 
and [production](https://supabase.com/dashboard/project/zepmgttkkbjigvvvbbce) databases respectively
3. Newly created tables need to be secured in all environments by turning on RLS (see Authorization section). It is ideal to do this
as closely to when the table creation migration is applied.

## Other Readings

Other optional readings that help inform the development practices are:
1. [Modern Software Development by Dave Farley](https://www.amazon.com/Modern-Software-Engineering-Discipline-Development/dp/0137314914)
2. [DORA metrics](https://cloud.google.com/blog/products/devops-sre/using-the-four-keys-to-measure-your-devops-performance)

## AI Development Workflow

We encourage leveraging AI tools in our development practices. It is a way we can achieve scale as a lean team.
We use cursor as code co-pilot. A list of cursor rules is in the code base in .cursor/rules. Adding to it 
also as a way to document code practices for our team.

### Tips

Getting the best results from AI tool use requires a combination of good prompts, managing context, and understanding the 
optimal level at which to iterate with the AI ([guide video](https://www.youtube.com/watch?v=uwA3MMYBfAQ)), and trial
and error. 

Some use cases which it performs well in are:
- design brainstorming
- initial template setup (e.g., especially for UI design)
- implementing feature when there are many good examples in the codebase already 
- debugging if you are able to effectively manage the context

### Caveats

We use AI as a tool to empower human-in-the-loop development not to replace it. Above all we must follow good code development 
practices as described above sections. All code must be reviewed and understood by the committer and held to the same code quality 
and standards as human written code. In addition, your understanding of the code must be maintained. Not doing so adds to technical 
and knowledge debt which will slow down development in the long-term.

## Deployments

We use Vercel for deployment which can be followed using this [guide](https://create.t3.gg/en/deployment/vercel).