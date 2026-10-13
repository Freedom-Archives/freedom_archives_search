
export const up = async function (knex) {
    

    await knex.raw(`SET LOCAL search_path = 'freedom_archives';`);
    await knex.raw(`
CREATE TABLE IF NOT EXISTS version_history (
    version_id integer GENERATED ALWAYS AS IDENTITY,
    archive_id integer NOT NULL,
    item_id integer NOT NULL,
    type text NOT NULL,
    superseded_at timestamptz DEFAULT now() NOT NULL,
    superseded_by text,
    data jsonb NOT NULL,
    CONSTRAINT version_history_pkey PRIMARY KEY (version_id),
    CONSTRAINT version_history_type_check CHECK (type IN ('record'::text, 'collection'::text))
);

CREATE INDEX IF NOT EXISTS version_history_item_idx ON version_history (type, item_id, superseded_at);

CREATE OR REPLACE VIEW version_history_view AS
 SELECT vh.version_id,
    vh.archive_id,
    vh.item_id,
    vh.type,
    vh.superseded_at,
    vh.superseded_by,
    vh.data,
    u.full_name AS superseded_by_name
   FROM version_history vh
     LEFT JOIN users u ON u.username = vh.superseded_by;
    `);
    await knex.raw(`SET LOCAL search_path = 'freedom_archives';`);
    

    await knex.raw(`SET LOCAL search_path = 'public_search';`);
    await knex.raw(`

    `);
    await knex.raw(`SET LOCAL search_path = 'freedom_archives';`);
    
};
  
export const down = async function (_knex) {
};
  
