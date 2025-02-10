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

# update migrations and remote db specified in .env.POSTGRES_URL
# from schema.prisma definition
# TODO setup .dotenv https://www.prisma.io/docs/orm/more/development-environment/environment-variables/using-multiple-env-files
db-migrate:
    prisma migrate dev

# drop data and re-seed the database from seed.ts
# note, if you do this, you must reapply grant permissions:
# https://stackoverflow.com/questions/67551593/supabase-client-permission-denied-for-schema-public
db-reset-hard:
   prisma migrate reset

start:
	yarn dev

stop:
    db-stop

generate-prisma:
    prisma generate