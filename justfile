setup-dep:
	yarn install

setup-db:
	[ -x "$(command -v docker)" ] || (echo "Docker is not installed, please install it" && exit 1)
	supabase login

# first time local development setup
setup: setup-dep setup-db

db-start:
	supabase start

db-stop:
	supabase stop --backup

# update and create new migrations from schema.prisma definition using .env.local database
# once created, these migrations will be run with prisma migrate deploy in test and prod as part
# of CI flow
db-migrate:
    prisma migrate dev

# drop data and re-seed the database from seed.ts
# note, if you do this, you must reapply grant permissions:
# https://stackoverflow.com/questions/67551593/supabase-client-permission-denied-for-schema-public
db-reset-hard:
   prisma migrate reset

start:
	yarn dev & stripe listen --forward-to localhost:3000/api/payments/webhook

stop:
    db-stop

generate-prisma:
    prisma generate

# This merges all changes from remote testing branch into remote main branch. Because Vercel automatically deploys prod
# on main branch updates, this effectively deploys current testing to production environment. If you need more granular
# deploy of prior commits, you should not use this but create a pull request into main.
#
# Notes:
# - *IMPORTANT* This will clear all local main changes not in origin/main. You should not have changes here in this workflow!
# - This will not work if there are uncommitted changes on your current branch. Please stash these before running the command.
deploy-prod:
    git fetch origin && git checkout main && git reset --hard origin/main && git merge origin/testing && git push origin main && git checkout -