
    CREATE EXTENSION IF NOT EXISTS pg_trgm;
    CREATE EXTENSION IF NOT EXISTS btree_gin;
    CREATE EXTENSION IF NOT EXISTS btree_gist;
    
--
-- pgschema database dump
--

-- Dumped from database version PostgreSQL 17.7
-- Dumped by pgschema version 1.4.3


--
-- Name: collections; Type: TABLE; Schema: -; Owner: -
--

CREATE TABLE IF NOT EXISTS collections (
    archive_id integer,
    collection_id integer,
    title text,
    description text,
    summary text,
    thumbnail text,
    date_modified timestamptz,
    descendant_collection_ids integer[],
    featured_records json,
    keywords jsonb,
    date_range text,
    ancestors jsonb,
    children jsonb,
    display_order integer,
    parent_collection_id integer,
    fulltext tsvector,
    search_text text,
    CONSTRAINT collections_pkey PRIMARY KEY (archive_id, collection_id)
);

CREATE INDEX IF NOT EXISTS collections_fulltext_idx ON collections USING gin (fulltext);

CREATE INDEX IF NOT EXISTS collections_search_text_idx ON collections USING gin (search_text gin_trgm_ops);
--
-- Name: config; Type: TABLE; Schema: -; Owner: -
--

CREATE TABLE IF NOT EXISTS config (
    archive_id integer NOT NULL,
    setting text NOT NULL,
    value jsonb
);

--
-- Name: featured_records; Type: TABLE; Schema: -; Owner: -
--

CREATE TABLE IF NOT EXISTS featured_records (
    record_id integer,
    archive_id integer,
    collection_id integer,
    record_order integer NOT NULL,
    label text,
    CONSTRAINT featured_records_pkey PRIMARY KEY (archive_id, record_id, collection_id)
);

--
-- Name: list_items; Type: TABLE; Schema: -; Owner: -
--

CREATE TABLE IF NOT EXISTS list_items (
    list_item_id integer,
    archive_id integer,
    item text,
    fulltext tsvector,
    search_text text,
    type text,
    description text,
    CONSTRAINT list_items_pkey PRIMARY KEY (archive_id, type, list_item_id)
);

--
-- Name: records; Type: TABLE; Schema: -; Owner: -
--

CREATE TABLE IF NOT EXISTS records (
    archive_id integer,
    record_id integer,
    title text,
    description text,
    vol_number text,
    has_digital boolean,
    date_modified timestamptz,
    date date,
    record_type text,
    format text,
    url text,
    thumbnail text,
    call_number text,
    year integer,
    subject_ids integer[],
    author_ids integer[],
    keyword_ids integer[],
    producer_ids integer[],
    publisher_ids integer[],
    program_id integer,
    collection_id integer,
    fulltext tsvector,
    search_text text,
    ancestor_collection_ids integer[],
    CONSTRAINT records_pkey PRIMARY KEY (archive_id, record_id)
);

--
-- Name: records_author_ids_idx; Type: INDEX; Schema: -; Owner: -
--

CREATE INDEX IF NOT EXISTS records_author_ids_idx ON records USING gin (author_ids);

--
-- Name: records_collection_id_idx; Type: INDEX; Schema: -; Owner: -
--

CREATE INDEX IF NOT EXISTS records_collection_id_idx ON records (archive_id, collection_id);

--
-- Name: records_format_idx; Type: INDEX; Schema: -; Owner: -
--

CREATE INDEX IF NOT EXISTS records_format_idx ON records (archive_id, format);

--
-- Name: records_fulltext_idx; Type: INDEX; Schema: -; Owner: -
--

CREATE INDEX IF NOT EXISTS records_fulltext_idx ON records USING gin (fulltext);

--
-- Name: records_has_digital_idx; Type: INDEX; Schema: -; Owner: -
--

CREATE INDEX IF NOT EXISTS records_has_digital_idx ON records (archive_id, has_digital);

--
-- Name: records_keyword_ids_idx; Type: INDEX; Schema: -; Owner: -
--

CREATE INDEX IF NOT EXISTS records_keyword_ids_idx ON records USING gin (keyword_ids);

--
-- Name: records_record_type_idx; Type: INDEX; Schema: -; Owner: -
--

CREATE INDEX IF NOT EXISTS records_record_type_idx ON records (archive_id, record_type);

--
-- Name: records_producer_ids_idx; Type: INDEX; Schema: -; Owner: -
--

CREATE INDEX IF NOT EXISTS records_producer_ids_idx ON records USING gin (producer_ids);

--
-- Name: records_program_id_idx; Type: INDEX; Schema: -; Owner: -
--

CREATE INDEX IF NOT EXISTS records_program_id_idx ON records (archive_id, program_id);

--
-- Name: records_publisher_ids_idx; Type: INDEX; Schema: -; Owner: -
--

CREATE INDEX IF NOT EXISTS records_publisher_ids_idx ON records USING gin (archive_id, publisher_ids);

--
-- Name: records_search_text_idx; Type: INDEX; Schema: -; Owner: -
--

CREATE INDEX IF NOT EXISTS records_search_text_idx ON records USING gin (search_text gin_trgm_ops);

--
-- Name: records_subject_ids_idx; Type: INDEX; Schema: -; Owner: -
--

CREATE INDEX IF NOT EXISTS records_subject_ids_idx ON records USING gin (subject_ids);

--
-- Name: records_year_idx; Type: INDEX; Schema: -; Owner: -
--

CREATE INDEX IF NOT EXISTS records_year_idx ON records (archive_id, year);


CREATE INDEX IF NOT EXISTS records_ancestor_collection_ids_idx ON records USING gin (ancestor_collection_ids);
--
-- Name: records_to_list_items; Type: TABLE; Schema: -; Owner: -
--

CREATE TABLE IF NOT EXISTS records_to_list_items (
    archive_id integer,
    list_item_id integer,
    record_id integer,
    CONSTRAINT records_to_list_items_pkey PRIMARY KEY (archive_id, list_item_id, record_id)
);

--
-- Name: records_to_list_items_idx; Type: INDEX; Schema: -; Owner: -
--

CREATE UNIQUE INDEX IF NOT EXISTS records_to_list_items_idx ON records_to_list_items (archive_id, record_id, list_item_id);

--
-- Name: records_view; Type: VIEW; Schema: -; Owner: -
--

CREATE OR REPLACE VIEW records_view AS
 SELECT r.archive_id,
    r.record_id,
    r.title,
    r.description,
    r.vol_number,
    r.has_digital,
    r.date_modified,
    r.date,
    r.record_type,
    r.format,
    r.url,
    r.thumbnail,
    r.call_number,
    r.year,
    r.subject_ids,
    r.author_ids,
    r.keyword_ids,
    r.producer_ids,
    r.publisher_ids,
    r.program_id,
    r.collection_id,
    r.fulltext,
    r.search_text,
    collections.title AS collection_title,
    json_build_object('item', programs.item, 'id', programs.list_item_id) AS program,
    ( SELECT json_agg(json_build_object('item', list_items.item, 'id', list_items.list_item_id)) AS json_agg
           FROM list_items
          WHERE list_items.list_item_id = ANY (r.publisher_ids)) AS publishers,
    ( SELECT json_agg(json_build_object('item', list_items.item, 'id', list_items.list_item_id)) AS json_agg
           FROM list_items
          WHERE list_items.list_item_id = ANY (r.producer_ids)) AS producers,
    ( SELECT json_agg(json_build_object('item', list_items.item, 'id', list_items.list_item_id)) AS json_agg
           FROM list_items
          WHERE list_items.list_item_id = ANY (r.author_ids)) AS authors,
    r.ancestor_collection_ids
   FROM records r
     JOIN collections USING (collection_id)
     LEFT JOIN list_items programs ON r.program_id = programs.list_item_id AND programs.type = 'program'::text;

