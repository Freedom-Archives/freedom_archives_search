export const up = async function (knex) {
  await knex.raw(`SET LOCAL search_path = 'public_search,freedom_archives';`);
  await knex.raw(`
ALTER TABLE public_search.collections ADD COLUMN fulltext tsvector;

ALTER TABLE public_search.collections ADD COLUMN search_text text;

ALTER TABLE public_search.collections ALTER COLUMN featured_records TYPE json;
`);
  await knex.raw(`
UPDATE public_search.collections pc set fulltext = c.fulltext, search_text = c.search_text
FROM freedom_archives.unified_collections c
WHERE pc.collection_id = c.collection_id;
`);
  await knex.raw(`
CREATE INDEX IF NOT EXISTS collections_fulltext_idx ON public_search.collections USING gin (fulltext);

-- pgschema:wait
SELECT 
    COALESCE(i.indisvalid, false) as done,
    CASE 
        WHEN p.blocks_total > 0 THEN p.blocks_done * 100 / p.blocks_total
        ELSE 0
    END as progress
FROM pg_class c
LEFT JOIN pg_index i ON c.oid = i.indexrelid
LEFT JOIN pg_stat_progress_create_index p ON c.oid = p.index_relid
WHERE c.relname = 'collections_fulltext_idx';
`);
  await knex.raw(`
CREATE INDEX IF NOT EXISTS collections_search_text_idx ON public_search.collections USING gin (search_text freedom_archives.gin_trgm_ops);

-- pgschema:wait
SELECT 
    COALESCE(i.indisvalid, false) as done,
    CASE 
        WHEN p.blocks_total > 0 THEN p.blocks_done * 100 / p.blocks_total
        ELSE 0
    END as progress
FROM pg_class c
LEFT JOIN pg_index i ON c.oid = i.indexrelid
LEFT JOIN pg_stat_progress_create_index p ON c.oid = p.index_relid
WHERE c.relname = 'collections_search_text_idx';
    `);
  await knex.raw(`SET LOCAL search_path = 'freedom_archives';`);
};

export const down = async function (_knex) {};
