#!/bin/bash
set -e

ENV=${1:-development}
if [ -n "$1" ]; then
  ENV=$1
  shift
else
  ENV=development
fi

if [ "$ENV" == "p" ] || [ "$ENV" == "prod" ] || [ "$ENV" == "sync" ]; then
  ENV="production"
fi

#if [ "$ENV" != "development" ] && [ "$ENV" != "production" ]; then
#  echo "Unknown environment: $ENV"
#  exit 1
#fi
source "$(dirname "$0")"/read_pg_config.sh "$ENV"

if [[ "$0" =~ "plus" ]]; then
  pgcli "$@"
else
  psql "$@"
fi

