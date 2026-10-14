export const up = async function (knex) {
  await knex.raw(`SET LOCAL search_path = 'freedom_archives';`);
  await knex.raw(`
ALTER TABLE _unified_records ADD COLUMN date_digitized timestamptz;

CREATE INDEX IF NOT EXISTS records_date_digitized ON freedom_archives._unified_records (date_digitized);

SELECT 
    COALESCE(i.indisvalid, false) as done,
    CASE 
        WHEN p.blocks_total > 0 THEN p.blocks_done * 100 / p.blocks_total
        ELSE 0
    END as progress
FROM pg_class c
LEFT JOIN pg_index i ON c.oid = i.indexrelid
LEFT JOIN pg_stat_progress_create_index p ON c.oid = p.index_relid
WHERE c.relname = 'records_date_digitized';

ALTER TABLE records ADD COLUMN date_digitized timestamptz;

CREATE OR REPLACE VIEW unified_records AS
 SELECT a.record_id,
    a.archive_id,
    a.title,
    a.description,
    a.notes,
    a.location,
    a.vol_number,
    a.collection_id,
    a.parent_record_id,
    a.primary_media_id,
    a.year,
    a.month,
    a.day,
    a.year_is_circa,
    a.program_id,
    a.needs_review,
    a.is_hidden,
    a.creator_user_id,
    a.contributor_user_id,
    a.date_created,
    a.date_modified,
    (((COALESCE(lpad(a.month::text, 2, '0'::text), '00'::text) || '/'::text) || COALESCE(lpad(a.day::text, 2, '0'::text), '00'::text)) || '/'::text) || COALESCE(a.year::text, '0000'::text) AS date_string,
    ((((COALESCE(a.year::text, '1900'::text) || '-'::text) || COALESCE(a.month::text, '01'::text)) || '-'::text) || COALESCE(a.day::text, '01'::text))::date AS date,
        CASE
            WHEN program_lookup.list_item_id IS NOT NULL THEN jsonb_build_object('item', program_lookup.item, 'list_item_id', program_lookup.list_item_id)
            ELSE NULL::jsonb
        END AS program,
    COALESCE(media.media, '[]'::jsonb) AS media,
    media.has_digital,
    COALESCE(media.media_count, 0::bigint) AS media_count,
    (contributor.firstname || ' '::text) || contributor.lastname AS contributor_name,
    contributor.username AS contributor_username,
    (creator.firstname || ' '::text) || creator.lastname AS creator_name,
    creator.username AS creator_username,
    media.call_numbers,
    media.call_numbers_text,
    media.formats,
    media.qualitys,
    media.generations,
    COALESCE(authors.items, '[]'::jsonb) AS authors,
    COALESCE(publishers.items, '[]'::jsonb) AS publishers,
    COALESCE(subjects.items, '[]'::jsonb) AS subjects,
    COALESCE(keywords.items, '[]'::jsonb) AS keywords,
    COALESCE(producers.items, '[]'::jsonb) AS producers,
    authors.items_text AS authors_text,
    subjects.items_text AS subjects_text,
    keywords.items_text AS keywords_text,
    producers.items_text AS producers_text,
    publishers.items_text AS publishers_text,
    authors.items_search AS authors_search,
    subjects.items_search AS subjects_search,
    keywords.items_search AS keywords_search,
    producers.items_search AS producers_search,
    publishers.items_search AS publishers_search,
    (((((((setweight(to_tsvector('english'::regconfig, COALESCE(a.title, ''::text)), 'A'::"char") || setweight(to_tsvector('simple'::regconfig, COALESCE(media.call_numbers_text, ''::text)), 'A'::"char")) || setweight(to_tsvector('english'::regconfig, COALESCE(a.description, ''::text)), 'B'::"char")) || setweight(to_tsvector('simple'::regconfig, COALESCE(authors.items_text, ''::text)), 'C'::"char")) || setweight(to_tsvector('english'::regconfig, COALESCE(subjects.items_text, ''::text)), 'C'::"char")) || setweight(to_tsvector('english'::regconfig, COALESCE(keywords.items_text, ''::text)), 'C'::"char")) || setweight(to_tsvector('simple'::regconfig, COALESCE(producers.items_text, ''::text)), 'C'::"char")) || setweight(to_tsvector('simple'::regconfig, COALESCE(publishers.items_text, ''::text)), 'C'::"char")) || setweight(to_tsvector('english'::regconfig, COALESCE(media.formats_text, ''::text)), 'C'::"char") AS fulltext,
    lower(regexp_replace(concat_ws(' ## '::text, NULLIF(a.title, ''::text), NULLIF(a.description, ''::text), NULLIF(media.call_numbers_text, ''::text), NULLIF(authors.items_text, ''::text), NULLIF(subjects.items_text, ''::text), NULLIF(keywords.items_text, ''::text), NULLIF(producers.items_text, ''::text), NULLIF(publishers.items_text, ''::text), NULLIF(media.formats_text, ''::text)), '\\s+'::text, ' '::text, 'g'::text)) AS search_text,
    b.primary_media_thumbnail,
    b.primary_media_format_id,
    b.primary_media_format_text,
    frt.record_type::text AS record_type,
    b.collection,
    children.children,
    siblings.siblings,
    parent.parent,
    continuations.continuations,
    a.fact_number,
    b.collection ->> 'title'::text AS collection_title,
    relationships.relationships,
    COALESCE(ARRAY( SELECT jsonb_array_elements_text(jsonb_path_query_array(c.ancestors, '$[*]."collection_id"'::jsonpath))::integer AS jsonb_array_elements_text), '{}'::integer[]) || ARRAY[c.collection_id] AS ancestor_collection_ids,
    authors.item_ids AS author_ids,
    subjects.item_ids AS subject_ids,
    keywords.item_ids AS keyword_ids,
    producers.item_ids AS producer_ids,
    publishers.item_ids AS publisher_ids,
    a.date_digitized
   FROM records a
     JOIN record_summaries b USING (record_id)
     JOIN _unified_collections c USING (collection_id)
     LEFT JOIN list_items program_lookup ON a.program_id = program_lookup.list_item_id
     LEFT JOIN record_media_view media USING (record_id)
     LEFT JOIN media primary_media ON a.primary_media_id = primary_media.media_id
     LEFT JOIN format_record_types frt ON primary_media.format_id = frt.list_item_id
     LEFT JOIN users contributor ON a.contributor_user_id = contributor.user_id
     LEFT JOIN users creator ON a.creator_user_id = creator.user_id
     LEFT JOIN records_list_items_view authors ON authors.type = 'author'::text AND authors.record_id = a.record_id
     LEFT JOIN records_list_items_view subjects ON subjects.type = 'subject'::text AND subjects.record_id = a.record_id
     LEFT JOIN records_list_items_view keywords ON keywords.type = 'keyword'::text AND keywords.record_id = a.record_id
     LEFT JOIN records_list_items_view producers ON producers.type = 'producer'::text AND producers.record_id = a.record_id
     LEFT JOIN records_list_items_view publishers ON publishers.type = 'publisher'::text AND publishers.record_id = a.record_id
     LEFT JOIN record_summaries parent_record ON a.parent_record_id = parent_record.record_id
     LEFT JOIN LATERAL ( SELECT jsonb_agg(to_jsonb(rr.*)) AS relationships
           FROM related_records rr
          WHERE rr.record_id_1 = a.record_id OR rr.record_id_2 = a.record_id AND rr.record_id_1 <> a.record_id) relationships ON true
     LEFT JOIN LATERAL ( SELECT array_agg(to_jsonb(record_summaries.*) ORDER BY record_summaries.title) AS children
           FROM record_summaries
          WHERE record_summaries.parent_record_id = a.record_id) children ON true
     LEFT JOIN LATERAL ( SELECT array_agg(to_jsonb(record_summaries.*) ORDER BY record_summaries.title) AS siblings
           FROM record_summaries
          WHERE record_summaries.parent_record_id = a.parent_record_id AND record_summaries.record_id <> a.record_id) siblings ON true
     LEFT JOIN LATERAL ( SELECT COALESCE(array_agg(to_jsonb(cr.*) ORDER BY (array_position(c_1.continuation_records, cr.record_id))), '{}'::jsonb[]) AS continuations
           FROM continuations c_1,
            LATERAL unnest(c_1.continuation_records) WITH ORDINALITY rid(rid, ordinality)
             JOIN record_summaries cr ON rid.rid = cr.record_id
          WHERE a.record_id = ANY (c_1.continuation_records)) continuations ON true
     CROSS JOIN LATERAL ( SELECT COALESCE(to_jsonb(parent_record.*), NULL::jsonb) AS parent) parent;
    `);

  await knex.raw(
    `UPDATE records SET date_digitized = date_modified WHERE record_id IN (SELECT record_id FROM media WHERE url <> '')`,
  );
  await knex.raw(
    "UPDATE _unified_records u SET date_digitized = r.date_digitized FROM records r WHERE r.record_id = u.record_id AND r.date_digitized IS NOT NULL",
  );
  await knex.raw(`SET LOCAL search_path = 'freedom_archives';`);

  await knex.raw(`SET LOCAL search_path = 'public_search';`);
  await knex.raw(`

    `);
  await knex.raw(`SET LOCAL search_path = 'freedom_archives';`);
};

export const down = async function (_knex) {};
