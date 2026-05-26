#!/bin/bash
ACTION=$1
TARGET_ENV=${2:-"development"}

set -e

MIGRATIONS_PATH="../migrations"

if [ "$ACTION" = "dump" ]; then
  source ./read_pg_config.sh development
  for i in freedom_archives public_search; do
    echo "
    CREATE EXTENSION IF NOT EXISTS pg_trgm;
    CREATE EXTENSION IF NOT EXISTS btree_gin;
    CREATE EXTENSION IF NOT EXISTS btree_gist;
    " >schema/$i.sql
    ./schema/pgschema dump --schema $i >>schema/$i.sql
  done
elif [ "$ACTION" = "create" ]; then
  source ./read_pg_config.sh "$TARGET_ENV"
  MIGRATION_NAME="${3}"
  if [ -z "$MIGRATION_NAME" ]; then
    MIGRATION_NAME="$(date +%Y%m%d%H%M%S)-migration"
  fi
  last_id=$(find "$MIGRATIONS_PATH" -type f -regex ".+\/[0-9]+.*\.js$" -printf "%f\n" 2>/dev/null | grep -oP '^\d+' | sort -n | tail -1)
  MIGRATION_ID=$(printf "%04d" $(( 10#${last_id:-0} + 1 )))
  MIGRATION_NAME="${MIGRATION_ID}_${MIGRATION_NAME}"

  echo "
export const up = async function (knex) {
    " >../migrations/"$MIGRATION_NAME".js
  for i in freedom_archives public_search; do
    echo "
    await knex.raw(\`SET LOCAL search_path = '${i}';\`);
    await knex.raw(\`
$(
      ./schema/pgschema plan --schema $i --file ./schema/$i.sql --output-human "$MIGRATIONS_PATH"/"$MIGRATION_NAME".$i.txt --output-sql stdout | sed 's/\\/\\\\/g'
    )
    \`);
    await knex.raw(\`SET LOCAL search_path = 'freedom_archives';\`);
    " >>$MIGRATIONS_PATH/"$MIGRATION_NAME".js
    cat $MIGRATIONS_PATH/"$MIGRATION_NAME".$i.txt >>$MIGRATIONS_PATH/"$MIGRATION_NAME".txt
    rm $MIGRATIONS_PATH/"$MIGRATION_NAME".$i.txt
  done
  echo "};
  
export const down = async function (_knex) {
};
  " >>$MIGRATIONS_PATH/"$MIGRATION_NAME".js
elif [ "$ACTION" = "apply" ]; then
echo "Applying schema to $TARGET_ENV environment"
  # if [ "$TARGET_ENV" = "development" ]; then
  #   source ./read_pg_config.sh development
  #   ./schema/pgschema apply --file ./schema/freedom_archives.sql --schema freedom_archives --db freedom_archives --auto-approve
  #   ./schema/pgschema apply --file ./schema/public_search.sql --schema public_search --db freedom_archives --auto-approve
  # else

    source ./read_pg_config.sh "$TARGET_ENV"
    ./schema/pgschema apply --file ./schema/freedom_archives.sql --schema freedom_archives 
    ./schema/pgschema apply --file ./schema/public_search.sql --schema public_search  

    # # source ./read_pg_config.sh production
    # cd ../
    # pwd
    # # echo $PGHOST
    # # export NODE_ENV=production
    # NODE_ENV=production yarn knex migrate:up
  # fi
else
  echo "Usage: $0 [dump | create [migration_name] | apply [development | prod]]"
fi
