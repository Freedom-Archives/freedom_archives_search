#!/usr/bin/env bash

ENV=${1:-development}

SCRIPT_DIR="$(cd -- "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE=$SCRIPT_DIR/../config/$ENV.json

PGPASSWORD=$(jq -r '.postgresql.connection.password' "$CONFIG_FILE")
PGUSER=$(jq -r '.postgresql.connection.user // env.USER' "$CONFIG_FILE")
PGDATABASE=$(jq -r '.postgresql.connection.database // env.USER' "$CONFIG_FILE")
PGPORT=$(jq -r '.postgresql.connection.port // "5432"' "$CONFIG_FILE")
PGHOST=$(jq -r '.postgresql.connection.host // "localhost"' "$CONFIG_FILE")
PGOPTIONS=--search_path=freedom_archives

export PGPASSWORD
export PGUSER
export PGDATABASE
export PGPORT
export PGHOST
export PGOPTIONS

# export PGSCHEMA_PLAN_PGOPTIONS="$PGOPTIONS"
