# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BuildIRL is a social club management platform built with Next.js 15, TypeScript, and tRPC. It enables communities to organize local events, manage memberships, and handle payments through Stripe.

## Tech Stack

- **Framework**: Next.js 15.0.1 with App Router
- **Language**: TypeScript with strict mode
- **UI**: Mantine UI v8.0.0 with custom theming and TipTap rich text editor
- **API**: tRPC for type-safe endpoints
- **Database**: PostgreSQL via Supabase with Prisma ORM
- **Auth**: Supabase Auth with SSO support
- **Payments**: Stripe with Connect for multi-tenant
- **Email**: Postmark via nodemailer with custom templates
- **State**: React Query (TanStack Query v5)
- **Forms**: React Hook Form with Zod validation

## Essential Commands

### Development
```bash
# First-time setup
just setup

# Start local Supabase
just db-start

# Start development server
yarn dev

# Push schema changes to database
yarn db:push

# Generate Prisma client after schema changes
yarn prisma generate
```

### Testing & Quality
```bash
# Run all checks (lint + typecheck)
yarn check

# Run tests
yarn test

# Type checking only
yarn typecheck

# Linting
yarn lint
yarn lint:fix

# Format code
yarn format
yarn format-check

# Check for unused exports
yarn unused-exports

# Full verification (format, types, system tests)
yarn verify
yarn format-verify
```

### Database
```bash
# Start local Supabase
just db-start

# Stop local Supabase
just db-stop

# Create migration from schema changes
just db-migrate

# Apply migrations
yarn db:migrate

# Generate Prisma client
yarn db:generate
just generate-prisma

# Open Prisma Studio
yarn db:studio

# Reset database (drops data)
just db-reset-hard
```

### Deployment
```bash
# Deploy to production (merges testing → main)
just deploy-prod

# Build for production
yarn build

# Preview production build
yarn preview

# Start production server
yarn start
```

## Architecture

### Directory Structure
```
/src
├── app/                    # Next.js App Router
│   ├── (login)/           # Auth routes (login, onboarding)
│   ├── (main)/            # Main app routes
│   │   ├── (join)/        # Public joining flow (apply, campaign, join)
│   │   ├── club/          # Club management and member actions
│   │   ├── settings/      # User settings
│   │   └── user/          # User profiles
│   └── api/               # API routes (tRPC, webhooks)
├── client/                # Client utilities
│   ├── components/        # Shared components
│   └── theme/             # Mantine theme
├── server/                # Server logic
│   ├── api/               # tRPC routers and authorization
│   ├── club/              # Club services
│   ├── user/              # User services
│   ├── email/             # Email services and templates
│   ├── following/         # Club following features
│   ├── membership/        # Membership management
│   ├── membershipTier/    # Tier and pricing logic
│   ├── payments/          # Stripe integration
│   ├── role/              # Role-based permissions
│   └── utils/             # Shared server utilities
└── trpc/                  # tRPC configuration
```

### Key Patterns

1. **Service Layer Pattern**: Business logic in `/src/server/[domain]/service.ts`
2. **tRPC Routers**: API endpoints in `/src/server/api/routers/`
3. **Type Safety**: Zod schemas for validation, Prisma for database types
4. **Authorization**: CASL for RBAC/ABAC, RLS for database security
5. **Server Components**: Use RSCs where possible, client components for interactivity

### Database Schema

Key models:
- `User`: Core user with Supabase auth integration
- `Club`: Multi-tenant club entities
- `MembershipTier`: Pricing tiers linked to Stripe
- `Membership`: User-club relationships with roles
- `EmailTemplate`: Customizable email templates per club (acceptance, rejection, departure)
- `EmailBlast`: Email campaigns to club members
- `ClubFollowing`: Users following clubs without membership
- `UserSocials`: Social media links for user profiles

### Environment Variables

Managed with `@t3-oss/env-nextjs` for type safety:
- Server variables: Database URLs, API keys (Stripe, Postmark, Supabase)
- Client variables: Public URLs and keys prefixed with `NEXT_PUBLIC_`
- Validation enforced at build time in `src/env.js`

## Development Workflow

1. **Branch Strategy**: Feature branches → `testing` → `main`
2. **Task Management**: Use TodoWrite tool for complex tasks
3. **Testing**: Write system tests for new features
4. **Code Style**: Follow existing patterns, use Prettier formatting
5. **Type Safety**: Leverage TypeScript strict mode, avoid `any`

## Common Tasks

### Adding a new tRPC endpoint
1. Create router in `/src/server/api/routers/`
2. Add Zod schema for input validation
3. Implement service method in `/src/server/[domain]/service.ts`
4. Add router to `/src/server/api/root.ts`

### Creating a new page
1. Add route in `/src/app/(main)/`
2. Use server components by default
3. Fetch data with tRPC in server components
4. Add client components only for interactivity

### Working with database
1. Update schema in `prisma/schema.prisma`
2. Run `yarn db:push` for development
3. Run `just db-migrate` to create migration for production
4. Run `yarn prisma generate` to update types

### Adding Stripe features
1. Use existing Stripe service in `/src/server/payments/`
2. Handle webhooks in `/src/app/api/payments/webhook/`
3. Test with Stripe CLI using: `just stripe-listen`
4. Stripe Connect accounts are managed per-club for multi-tenant payments

## Important Notes

- **Authentication**: Always use `getServerAuthSession()` in server components
- **Authorization**: Check permissions with CASL abilities
- **Error Handling**: Use tRPC error codes for API errors
- **Performance**: Use React Query for client-side caching
- **Security**: Never expose sensitive data in client components
- **Testing**: Focus on system tests over unit tests (TDD approach)
- **Email**: Use email templates and blast functionality for club communications
- **Campaigns**: Support fundraising campaigns with contribution tracking