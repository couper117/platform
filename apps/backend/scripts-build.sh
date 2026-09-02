#!/usr/bin/env sh
# Vercel build step.
#
# Fails fast and says why, rather than hanging. `prisma migrate deploy` through a
# transaction pooler does not error — it waits, and a build sits at "Building" for
# fifteen minutes before the platform gives up, which tells nobody anything.
set -e

: "${DATABASE_URL:?DATABASE_URL is not set on this project}"

# schema.prisma requires DIRECT_DATABASE_URL to exist. config/env.ts documents a
# fallback to DATABASE_URL, and Prisma reads the raw environment rather than that
# file, so the fallback has to be applied here too.
if [ -z "$DIRECT_DATABASE_URL" ]; then
  case "$DATABASE_URL" in
    *pooler*|*:6543*|*pgbouncer=true*)
      echo "DIRECT_DATABASE_URL is not set, and DATABASE_URL is a pooled connection." >&2
      echo "Migrations cannot run through a transaction pooler — the command would hang" >&2
      echo "rather than fail. Set DIRECT_DATABASE_URL to the direct connection" >&2
      echo "(Supabase: the same database on port 5432). See docs/DEPLOYMENT.md." >&2
      exit 1
      ;;
    *)
      echo "DIRECT_DATABASE_URL not set; falling back to DATABASE_URL, which is not pooled."
      DIRECT_DATABASE_URL="$DATABASE_URL"
      export DIRECT_DATABASE_URL
      ;;
  esac
fi

npx prisma generate
npx prisma migrate deploy
