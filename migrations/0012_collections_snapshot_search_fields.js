export const up = async function (knex) {
  await knex.raw(`SET LOCAL search_path = 'freedom_archives';`);
  await knex.raw(`
ALTER TABLE collections_snapshots ADD COLUMN fulltext tsvector;

ALTER TABLE collections_snapshots ADD COLUMN search_text text;
    `);
  await knex.raw(`SET LOCAL search_path = 'freedom_archives';`);

  await knex.raw(`SET LOCAL search_path = 'public_search';`);
  await knex.raw(`

    `);
  await knex.raw(`SET LOCAL search_path = 'freedom_archives';`);
};

export const down = async function (_knex) {};
