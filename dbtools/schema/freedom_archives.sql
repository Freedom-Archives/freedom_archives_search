
    CREATE EXTENSION IF NOT EXISTS pg_trgm;
    CREATE EXTENSION IF NOT EXISTS btree_gin;
    CREATE EXTENSION IF NOT EXISTS btree_gist;
    
--
-- pgschema database dump
--

-- Dumped from database version PostgreSQL 17.7
-- Dumped by pgschema version 1.4.3


--
-- Name: user_role; Type: TYPE; Schema: -; Owner: -
--

CREATE TYPE user_role AS ENUM (
    'intern',
    'staff',
    'administrator'
);

--
-- Name: _unified_collections; Type: TABLE; Schema: -; Owner: -
--

CREATE TABLE IF NOT EXISTS _unified_collections (
    collection_id integer,
    archive_id integer,
    parent_collection_id integer,
    title text,
    description text,
    description_search text,
    summary text,
    call_number_id integer,
    call_number_suffix text,
    notes text,
    thumbnail text,
    display_order integer,
    date_range text,
    needs_review boolean,
    is_hidden boolean,
    creator_user_id integer,
    contributor_user_id integer,
    date_created timestamptz,
    date_modified timestamptz,
    call_number text,
    contributor_name text,
    contributor_username text,
    creator_name text,
    creator_username text,
    call_number_item jsonb,
    publishers jsonb,
    subjects jsonb,
    keywords jsonb,
    subjects_text text,
    keywords_text text,
    publishers_text text,
    subjects_search text[],
    keywords_search text[],
    publishers_search text[],
    child_records jsonb,
    featured_records jsonb,
    fulltext tsvector,
    search_text text,
    parent jsonb,
    children jsonb[],
    descendant_collection_ids integer[],
    ancestors jsonb,
    CONSTRAINT _unified_collections_pkey PRIMARY KEY (collection_id)
);

--
-- Name: collections_call_number_index; Type: INDEX; Schema: -; Owner: -
--

CREATE INDEX IF NOT EXISTS collections_call_number_index ON _unified_collections (call_number);

--
-- Name: collections_description_index; Type: INDEX; Schema: -; Owner: -
--

CREATE INDEX IF NOT EXISTS collections_description_index ON _unified_collections USING gin (description_search gin_trgm_ops);

--
-- Name: collections_fulltext_index; Type: INDEX; Schema: -; Owner: -
--

CREATE INDEX IF NOT EXISTS collections_fulltext_index ON _unified_collections USING gin (fulltext);

--
-- Name: collections_keywords_index; Type: INDEX; Schema: -; Owner: -
--

CREATE INDEX IF NOT EXISTS collections_keywords_index ON _unified_collections USING gin (keywords_search);

--
-- Name: collections_publishers_index; Type: INDEX; Schema: -; Owner: -
--

CREATE INDEX IF NOT EXISTS collections_publishers_index ON _unified_collections (publishers_search);

--
-- Name: collections_search_text_index; Type: INDEX; Schema: -; Owner: -
--

CREATE INDEX IF NOT EXISTS collections_search_text_index ON _unified_collections USING gin (search_text gin_trgm_ops);

--
-- Name: collections_subjects_index; Type: INDEX; Schema: -; Owner: -
--

CREATE INDEX IF NOT EXISTS collections_subjects_index ON _unified_collections USING gin (subjects_search);

--
-- Name: collections_summary_index; Type: INDEX; Schema: -; Owner: -
--

CREATE INDEX IF NOT EXISTS collections_summary_index ON _unified_collections (summary);

--
-- Name: collections_title_index; Type: INDEX; Schema: -; Owner: -
--

CREATE INDEX IF NOT EXISTS collections_title_index ON _unified_collections (title);

--
-- Name: _unified_records; Type: TABLE; Schema: -; Owner: -
--

CREATE TABLE IF NOT EXISTS _unified_records (
    record_id integer,
    archive_id integer,
    title text,
    description text,
    notes text,
    location text,
    vol_number text,
    collection_id integer,
    parent_record_id integer,
    primary_media_id integer,
    year integer,
    month integer,
    day integer,
    year_is_circa boolean,
    program_id integer,
    needs_review boolean,
    is_hidden boolean,
    creator_user_id integer,
    contributor_user_id integer,
    date_created timestamptz,
    date_modified timestamptz,
    date_string text,
    date date,
    program jsonb,
    media jsonb,
    has_digital boolean,
    media_count bigint,
    contributor_name text,
    contributor_username text,
    creator_name text,
    creator_username text,
    call_numbers text[],
    call_numbers_text text,
    formats integer[],
    qualitys integer[],
    generations integer[],
    authors jsonb,
    publishers jsonb,
    subjects jsonb,
    keywords jsonb,
    producers jsonb,
    authors_text text,
    subjects_text text,
    keywords_text text,
    producers_text text,
    publishers_text text,
    authors_search text[],
    subjects_search text[],
    keywords_search text[],
    producers_search text[],
    publishers_search text[],
    fulltext tsvector,
    search_text text,
    primary_media_thumbnail TEXT,
    primary_media_format_id INTEGER,
    primary_media_format_text TEXT,
    record_type TEXT,
    collection jsonb,
    children jsonb[],
    siblings jsonb[],
    parent jsonb,
    continuations jsonb[],
    fact_number text,
    collection_title text,
    relationships jsonb,
    ancestor_collection_ids integer[],
    author_ids integer[],
    subject_ids integer[],
    keyword_ids integer[],
    producer_ids integer[],
    publisher_ids integer[],
    CONSTRAINT _unified_records_pkey PRIMARY KEY (record_id)
);

--
-- Name: records_authors_search; Type: INDEX; Schema: -; Owner: -
--

CREATE INDEX IF NOT EXISTS records_authors_search ON _unified_records USING gin (authors_search);

--
-- Name: records_call_numbers; Type: INDEX; Schema: -; Owner: -
--

CREATE INDEX IF NOT EXISTS records_call_numbers ON _unified_records USING gin (call_numbers);

--
-- Name: records_collection_id; Type: INDEX; Schema: -; Owner: -
--

CREATE INDEX IF NOT EXISTS records_collection_id ON _unified_records (collection_id);

--
-- Name: records_fulltext_index; Type: INDEX; Schema: -; Owner: -
--

CREATE INDEX IF NOT EXISTS records_fulltext_index ON _unified_records USING gin (fulltext);

--
-- Name: records_has_digital; Type: INDEX; Schema: -; Owner: -
--

CREATE INDEX IF NOT EXISTS records_has_digital ON _unified_records (has_digital);

--
-- Name: records_keywords_search; Type: INDEX; Schema: -; Owner: -
--

CREATE INDEX IF NOT EXISTS records_keywords_search ON _unified_records USING gin (keywords_search);

--
-- Name: records_parent_record_id; Type: INDEX; Schema: -; Owner: -
--

CREATE INDEX IF NOT EXISTS records_parent_record_id ON _unified_records (parent_record_id);

--
-- Name: records_producers_search; Type: INDEX; Schema: -; Owner: -
--

CREATE INDEX IF NOT EXISTS records_producers_search ON _unified_records USING gin (producers_search);

--
-- Name: records_search_text_index; Type: INDEX; Schema: -; Owner: -
--

CREATE INDEX IF NOT EXISTS records_search_text_index ON _unified_records USING gin (search_text gin_trgm_ops);

--
-- Name: records_subjects_search; Type: INDEX; Schema: -; Owner: -
--

CREATE INDEX IF NOT EXISTS records_subjects_search ON _unified_records USING gin (subjects_search);


--
-- Name: records_record_type; Type: INDEX; Schema: -; Owner: -
--

CREATE INDEX IF NOT EXISTS records_record_type ON _unified_records (record_type);


--
-- Name: records_title; Type: INDEX; Schema: -; Owner: -
--

CREATE INDEX IF NOT EXISTS records_title ON _unified_records (title);

--
-- Name: records_year; Type: INDEX; Schema: -; Owner: -
--

CREATE INDEX IF NOT EXISTS records_year ON _unified_records (year);

CREATE INDEX IF NOT EXISTS records_ancestor_collection_ids_idx ON _unified_records USING gin (ancestor_collection_ids);
--
-- Name: archives; Type: TABLE; Schema: -; Owner: -
--

CREATE TABLE IF NOT EXISTS archives (
    archive_id SERIAL,
    title text,
    CONSTRAINT archives_pkey PRIMARY KEY (archive_id)
);

--
-- Name: config; Type: TABLE; Schema: -; Owner: -
--

CREATE TABLE IF NOT EXISTS config (
    archive_id integer NOT NULL,
    setting text NOT NULL,
    value jsonb DEFAULT '""',
    CONSTRAINT config_archive_id_fkey FOREIGN KEY (archive_id) REFERENCES archives (archive_id)
);

--
-- Name: settings_key; Type: INDEX; Schema: -; Owner: -
--

CREATE INDEX IF NOT EXISTS settings_key ON config (archive_id, setting);

--
-- Name: continuations; Type: TABLE; Schema: -; Owner: -
--

CREATE TABLE IF NOT EXISTS continuations (
    continuation_id SERIAL,
    continuation_records integer[],
    CONSTRAINT continuations_pkey PRIMARY KEY (continuation_id)
);

--
-- Name: duplicate_relations; Type: TABLE; Schema: -; Owner: -
--

CREATE TABLE IF NOT EXISTS duplicate_relations (
    id integer
);

--
-- Name: knex_migrations; Type: TABLE; Schema: -; Owner: -
--

CREATE TABLE IF NOT EXISTS knex_migrations (
    id SERIAL,
    name varchar(255),
    batch integer,
    migration_time timestamptz,
    CONSTRAINT knex_migrations_pkey PRIMARY KEY (id)
);

--
-- Name: knex_migrations_lock; Type: TABLE; Schema: -; Owner: -
--

CREATE TABLE IF NOT EXISTS knex_migrations_lock (
    index SERIAL,
    is_locked integer,
    CONSTRAINT knex_migrations_lock_pkey PRIMARY KEY (index)
);

--
-- Name: list_items; Type: TABLE; Schema: -; Owner: -
--

CREATE TABLE IF NOT EXISTS list_items (
    list_item_id SERIAL,
    archive_id integer,
    item text NOT NULL,
    fulltext tsvector GENERATED ALWAYS AS (to_tsvector('english'::regconfig, COALESCE(item, ''::text))) STORED,
    search_text text GENERATED ALWAYS AS (lower(COALESCE(item, ''::text))) STORED,
    type text NOT NULL,
    description text,
    CONSTRAINT list_items_pkey PRIMARY KEY (list_item_id),
    CONSTRAINT list_items_archive_id_fkey FOREIGN KEY (archive_id) REFERENCES archives (archive_id) ON DELETE CASCADE
);

--
-- Name: list_items_fulltext_idx; Type: INDEX; Schema: -; Owner: -
--

CREATE INDEX IF NOT EXISTS list_items_fulltext_idx ON list_items USING gin (fulltext);

--
-- Name: list_items_search_text_idx; Type: INDEX; Schema: -; Owner: -
--

CREATE INDEX IF NOT EXISTS list_items_search_text_idx ON list_items (search_text);

CREATE INDEX IF NOT EXISTS list_items_search_text_trgm_idx ON list_items USING gin (search_text gin_trgm_ops);

--
-- Name: list_items_type_idx; Type: INDEX; Schema: -; Owner: -
--

CREATE UNIQUE INDEX IF NOT EXISTS list_items_type_idx ON list_items (type, item, archive_id);

CREATE TYPE record_type AS ENUM (
    'Audio',
    'Video',
    'Image',
    'Website',
    'Document',
    'Other'
);

CREATE TABLE format_record_types (
  list_item_id INTEGER,
  record_type record_type,
  CONSTRAINT format_record_types_pkey PRIMARY KEY (list_item_id),
  CONSTRAINT format_record_types_list_item_fkey FOREIGN KEY (list_item_id) REFERENCES freedom_archives.list_items (list_item_id) ON DELETE CASCADE
);

--
-- Name: settings; Type: TABLE; Schema: -; Owner: -
--

CREATE TABLE IF NOT EXISTS settings (
    archive_id integer,
    settings jsonb DEFAULT '""',
    CONSTRAINT settings_pkey PRIMARY KEY (archive_id),
    CONSTRAINT settings_archive_id_foreign FOREIGN KEY (archive_id) REFERENCES archives (archive_id)
);

--
-- Name: snapshots; Type: TABLE; Schema: -; Owner: -
--

CREATE TABLE IF NOT EXISTS snapshots (
    snapshot_id SERIAL,
    archive_id integer NOT NULL,
    title varchar(100) DEFAULT '' NOT NULL,
    date_published timestamptz DEFAULT now(),
    records_count integer DEFAULT 0,
    collections_count integer DEFAULT 0,
    max_record_date timestamptz,
    max_collection_date timestamptz,
    is_live boolean GENERATED ALWAYS AS (((title)::text = 'Public Data'::text)) STORED,
    CONSTRAINT snapshots_pkey PRIMARY KEY (snapshot_id),
    CONSTRAINT snapshots_archive_id_fkey FOREIGN KEY (archive_id) REFERENCES archives (archive_id)
);

--
-- Name: snapshot_archive_idx; Type: INDEX; Schema: -; Owner: -
--

CREATE INDEX IF NOT EXISTS snapshot_archive_idx ON snapshots (archive_id, snapshot_id);

--
-- Name: collections_snapshots; Type: TABLE; Schema: -; Owner: -
--

CREATE TABLE IF NOT EXISTS collections_snapshots (
    snapshot_id integer,
    archive_id integer,
    collection_id integer,
    title text,
    description text,
    summary text,
    thumbnail text,
    date_modified timestamptz,
    descendant_collection_ids integer[],
    featured_records jsonb,
    keywords jsonb,
    date_range text,
    ancestors jsonb,
    children jsonb,
    display_order integer,
    parent_collection_id integer,
    fulltext tsvector,
    search_text text,
    CONSTRAINT collections_snapshots_pkey PRIMARY KEY (snapshot_id, archive_id, collection_id),
    CONSTRAINT fk_snapshot FOREIGN KEY (snapshot_id) REFERENCES snapshots (snapshot_id) ON DELETE CASCADE
);

--
-- Name: config_snapshots; Type: TABLE; Schema: -; Owner: -
--

CREATE TABLE IF NOT EXISTS config_snapshots (
    snapshot_id integer,
    archive_id integer,
    setting text,
    value jsonb,
    CONSTRAINT config_snapshots_pkey PRIMARY KEY (snapshot_id, archive_id, setting),
    CONSTRAINT fk_snapshot FOREIGN KEY (snapshot_id) REFERENCES snapshots (snapshot_id) ON DELETE CASCADE
);

--
-- Name: featured_records_snapshots; Type: TABLE; Schema: -; Owner: -
--

CREATE TABLE IF NOT EXISTS featured_records_snapshots (
    snapshot_id integer,
    record_id integer,
    archive_id integer,
    collection_id integer,
    record_order integer,
    label text,
    CONSTRAINT featured_records_snapshots_pkey PRIMARY KEY (snapshot_id, archive_id, record_id, collection_id),
    CONSTRAINT fk_snapshot FOREIGN KEY (snapshot_id) REFERENCES snapshots (snapshot_id) ON DELETE CASCADE
);

--
-- Name: list_items_snapshots; Type: TABLE; Schema: -; Owner: -
--

CREATE TABLE IF NOT EXISTS list_items_snapshots (
    snapshot_id integer,
    list_item_id integer,
    archive_id integer,
    item text,
    fulltext tsvector,
    search_text text,
    type text,
    description text,
    CONSTRAINT list_items_snapshots_pkey PRIMARY KEY (snapshot_id, archive_id, list_item_id),
    CONSTRAINT fk_snapshot FOREIGN KEY (snapshot_id) REFERENCES snapshots (snapshot_id) ON DELETE CASCADE
);

--
-- Name: records_snapshots; Type: TABLE; Schema: -; Owner: -
--

CREATE TABLE IF NOT EXISTS records_snapshots (
    snapshot_id integer,
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
    CONSTRAINT records_snapshots_pkey PRIMARY KEY (snapshot_id, archive_id, record_id),
    CONSTRAINT fk_snapshot FOREIGN KEY (snapshot_id) REFERENCES snapshots (snapshot_id) ON DELETE CASCADE
);

--
-- Name: records_to_list_items_snapshots; Type: TABLE; Schema: -; Owner: -
--

CREATE TABLE IF NOT EXISTS records_to_list_items_snapshots (
    snapshot_id integer,
    archive_id integer,
    list_item_id integer,
    record_id integer,
    CONSTRAINT records_to_list_items_snapshots_pkey PRIMARY KEY (snapshot_id, archive_id, list_item_id, record_id),
    CONSTRAINT fk_snapshot FOREIGN KEY (snapshot_id) REFERENCES snapshots (snapshot_id) ON DELETE CASCADE
);

--
-- Name: unknown_relations; Type: TABLE; Schema: -; Owner: -
--

CREATE TABLE IF NOT EXISTS unknown_relations (
    id integer,
    docid_1 integer,
    docid_2 integer,
    title_1 text,
    description_1 text,
    track_number_1 integer,
    title_2 text,
    description_2 text,
    track_number_2 integer,
    type text,
    notes text,
    "user" text,
    updated_at timestamptz,
    call_number_1 text,
    call_number_2 text,
    generation_1 text,
    generation_2 text,
    format_1 varchar(100),
    format_2 varchar(100)
);

--
-- Name: users; Type: TABLE; Schema: -; Owner: -
--

CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL,
    archive_id integer NOT NULL,
    username text NOT NULL,
    firstname text,
    lastname text,
    role user_role,
    password text,
    active boolean DEFAULT false,
    email text,
    full_name text GENERATED ALWAYS AS (TRIM(BOTH FROM ((firstname || ' '::text) || lastname))) STORED,
    user_search text GENERATED ALWAYS AS (TRIM(BOTH FROM ((((((username || ' '::text) || firstname) || ' '::text) || lastname) || ' '::text) || email))) STORED,
    CONSTRAINT users_pkey PRIMARY KEY (user_id),
    CONSTRAINT users_username_key UNIQUE (username),
    CONSTRAINT users_archive_id_fkey FOREIGN KEY (archive_id) REFERENCES archives (archive_id)
);

--
-- Name: collections; Type: TABLE; Schema: -; Owner: -
--

CREATE TABLE IF NOT EXISTS collections (
    collection_id SERIAL,
    archive_id integer,
    parent_collection_id integer,
    title text,
    description text,
    description_search text,
    summary text,
    call_number_id integer,
    call_number_suffix text,
    notes text,
    thumbnail text,
    display_order integer DEFAULT 1000 NOT NULL,
    date_range text,
    needs_review boolean DEFAULT false,
    is_hidden boolean DEFAULT false,
    creator_user_id integer,
    contributor_user_id integer,
    date_created timestamptz,
    date_modified timestamptz,
    CONSTRAINT collections_pkey PRIMARY KEY (collection_id),
    CONSTRAINT collections_archive_id_fkey FOREIGN KEY (archive_id) REFERENCES archives (archive_id) ON DELETE CASCADE,
    CONSTRAINT collections_call_number_id_fkey FOREIGN KEY (call_number_id) REFERENCES list_items (list_item_id) ON DELETE SET NULL,
    CONSTRAINT collections_contributor_user_id_fkey FOREIGN KEY (contributor_user_id) REFERENCES users (user_id),
    CONSTRAINT collections_creator_user_id_fkey FOREIGN KEY (creator_user_id) REFERENCES users (user_id),
    CONSTRAINT collections_parent_collection_id_fkey FOREIGN KEY (parent_collection_id) REFERENCES collections (collection_id) ON DELETE SET NULL
);

--
-- Name: collection_display_order_idx; Type: INDEX; Schema: -; Owner: -
--

CREATE INDEX IF NOT EXISTS collection_display_order_idx ON collections (display_order);

--
-- Name: collections_archive_id_idx; Type: INDEX; Schema: -; Owner: -
--

CREATE INDEX IF NOT EXISTS collections_archive_id_idx ON collections (archive_id);

--
-- Name: collections_call_number_id_idx; Type: INDEX; Schema: -; Owner: -
--

CREATE INDEX IF NOT EXISTS collections_call_number_id_idx ON collections (call_number_id);

--
-- Name: collections_parent_collection_id_idx; Type: INDEX; Schema: -; Owner: -
--

CREATE INDEX IF NOT EXISTS collections_parent_collection_id_idx ON collections (parent_collection_id);

--
-- Name: collections_to_list_items; Type: TABLE; Schema: -; Owner: -
--

CREATE TABLE IF NOT EXISTS collections_to_list_items (
    list_item_id integer,
    collection_id integer,
    CONSTRAINT collections_to_list_items_pkey PRIMARY KEY (list_item_id, collection_id),
    CONSTRAINT collections_to_list_items_collection_id_fkey FOREIGN KEY (collection_id) REFERENCES collections (collection_id) ON DELETE CASCADE,
    CONSTRAINT collections_to_list_items_list_item_id_fkey FOREIGN KEY (list_item_id) REFERENCES list_items (list_item_id) ON DELETE CASCADE
);

--
-- Name: records; Type: TABLE; Schema: -; Owner: -
--

CREATE TABLE IF NOT EXISTS records (
    record_id SERIAL,
    archive_id integer NOT NULL,
    title text,
    description text,
    notes text,
    location text,
    vol_number text,
    collection_id integer NOT NULL DEFAULT 1000,
    parent_record_id integer,
    primary_media_id integer,
    year integer,
    month integer,
    day integer,
    year_is_circa boolean DEFAULT false,
    program_id integer,
    needs_review boolean DEFAULT false,
    is_hidden boolean DEFAULT false,
    creator_user_id integer,
    contributor_user_id integer,
    date_created timestamptz,
    date_modified timestamptz,
    fact_number text,
    CONSTRAINT records_pkey PRIMARY KEY (record_id),
    CONSTRAINT records_archive_id_fkey FOREIGN KEY (archive_id) REFERENCES archives (archive_id) ON DELETE CASCADE,
    CONSTRAINT records_collection_id_fkey FOREIGN KEY (collection_id) REFERENCES collections (collection_id) ON DELETE SET DEFAULT,
    CONSTRAINT records_contributor_user_id_fkey FOREIGN KEY (contributor_user_id) REFERENCES users (user_id),
    CONSTRAINT records_creator_user_id_fkey FOREIGN KEY (creator_user_id) REFERENCES users (user_id),
    CONSTRAINT records_program_id_fkey FOREIGN KEY (program_id) REFERENCES list_items (list_item_id) ON DELETE SET NULL
);

--
-- Name: records_archive_id_idx; Type: INDEX; Schema: -; Owner: -
--

CREATE INDEX IF NOT EXISTS records_archive_id_idx ON records (archive_id);

--
-- Name: records_collection_id_idx; Type: INDEX; Schema: -; Owner: -
--

CREATE INDEX IF NOT EXISTS records_collection_id_idx ON records (collection_id);

--
-- Name: records_parent_record_id_idx; Type: INDEX; Schema: -; Owner: -
--

CREATE INDEX IF NOT EXISTS records_parent_record_id_idx ON records (parent_record_id);

--
-- Name: records_primary_media_id_idx; Type: INDEX; Schema: -; Owner: -
--

CREATE INDEX IF NOT EXISTS records_primary_media_id_idx ON records (primary_media_id);

--
-- Name: featured_records; Type: TABLE; Schema: -; Owner: -
--

CREATE TABLE IF NOT EXISTS featured_records (
    record_id integer NOT NULL,
    archive_id integer NOT NULL,
    collection_id integer NOT NULL,
    record_order integer NOT NULL,
    label text,
    CONSTRAINT featured_records_archive_id_fkey FOREIGN KEY (archive_id) REFERENCES archives (archive_id) ON DELETE CASCADE,
    CONSTRAINT featured_records_collection_id_fkey FOREIGN KEY (collection_id) REFERENCES collections (collection_id) ON DELETE CASCADE,
    CONSTRAINT featured_records_record_id_fkey FOREIGN KEY (record_id) REFERENCES records (record_id) ON DELETE CASCADE
);

--
-- Name: featured_records_idx; Type: INDEX; Schema: -; Owner: -
--

CREATE UNIQUE INDEX IF NOT EXISTS featured_records_idx ON featured_records (archive_id, collection_id, record_id);

--
-- Name: media; Type: TABLE; Schema: -; Owner: -
--

CREATE TABLE IF NOT EXISTS media (
    media_id SERIAL,
    archive_id integer,
    call_number_id integer,
    call_number_suffix text,
    record_id integer NOT NULL,
    format_id integer,
    no_copies integer DEFAULT 1,
    quality_id integer,
    generation_id integer,
    url text DEFAULT '' NOT NULL,
    thumbnail text,
    creator_user_id integer,
    contributor_user_id integer,
    date_created timestamptz,
    date_modified timestamptz,
    original_doc_id integer,
    CONSTRAINT media_pkey PRIMARY KEY (media_id),
    CONSTRAINT media_archive_id_fkey FOREIGN KEY (archive_id) REFERENCES archives (archive_id) ON DELETE CASCADE,
    CONSTRAINT media_call_number_id_fkey FOREIGN KEY (call_number_id) REFERENCES list_items (list_item_id) ON DELETE SET NULL,
    CONSTRAINT media_contributor_user_id_fkey FOREIGN KEY (contributor_user_id) REFERENCES users (user_id),
    CONSTRAINT media_creator_user_id_fkey FOREIGN KEY (creator_user_id) REFERENCES users (user_id),
    CONSTRAINT media_format_id_fkey FOREIGN KEY (format_id) REFERENCES list_items (list_item_id) ON DELETE SET NULL,
    CONSTRAINT media_generation_id_fkey FOREIGN KEY (generation_id) REFERENCES list_items (list_item_id) ON DELETE SET NULL,
    CONSTRAINT media_quality_id_fkey FOREIGN KEY (quality_id) REFERENCES list_items (list_item_id) ON DELETE SET NULL,
    CONSTRAINT media_record_id_fkey FOREIGN KEY (record_id) REFERENCES records (record_id) ON DELETE CASCADE
);

--
-- Name: media_call_number_id; Type: INDEX; Schema: -; Owner: -
--

CREATE INDEX IF NOT EXISTS media_call_number_id ON media (call_number_id);

--
-- Name: media_call_number_suffix; Type: INDEX; Schema: -; Owner: -
--

CREATE INDEX IF NOT EXISTS media_call_number_suffix ON media (call_number_suffix);

--
-- Name: media_format; Type: INDEX; Schema: -; Owner: -
--

CREATE INDEX IF NOT EXISTS media_format ON media (format_id);

--
-- Name: media_generation; Type: INDEX; Schema: -; Owner: -
--

CREATE INDEX IF NOT EXISTS media_generation ON media (generation_id);

--
-- Name: media_quality; Type: INDEX; Schema: -; Owner: -
--

CREATE INDEX IF NOT EXISTS media_quality ON media (quality_id);

--
-- Name: media_to_list_items; Type: TABLE; Schema: -; Owner: -
--

CREATE TABLE IF NOT EXISTS media_to_list_items (
    list_item_id integer,
    media_id integer,
    CONSTRAINT media_to_list_items_pkey PRIMARY KEY (list_item_id, media_id),
    CONSTRAINT media_to_list_items_list_item_id_fkey FOREIGN KEY (list_item_id) REFERENCES list_items (list_item_id) ON DELETE CASCADE,
    CONSTRAINT media_to_list_items_media_id_fkey FOREIGN KEY (media_id) REFERENCES media (media_id) ON DELETE CASCADE
);

--
-- Name: records_to_list_items; Type: TABLE; Schema: -; Owner: -
--

CREATE TABLE IF NOT EXISTS records_to_list_items (
    list_item_id integer,
    record_id integer,
    CONSTRAINT records_to_list_items_pkey PRIMARY KEY (list_item_id, record_id),
    CONSTRAINT records_to_list_items_list_item_id_fkey FOREIGN KEY (list_item_id) REFERENCES list_items (list_item_id) ON DELETE CASCADE,
    CONSTRAINT records_to_list_items_record_id_fkey FOREIGN KEY (record_id) REFERENCES records (record_id) ON DELETE CASCADE
);

--
-- Name: collection_summaries; Type: VIEW; Schema: -; Owner: -
--

CREATE OR REPLACE VIEW collection_summaries AS
 SELECT a.collection_id,
    a.title,
    a.parent_collection_id,
    a.summary,
    a.description,
    a.thumbnail,
    NULLIF(TRIM(BOTH FROM (COALESCE(call_numbers.item, ''::text) || ' '::text) || COALESCE(a.call_number_suffix, ''::text)), ''::text) AS call_number,
    a.display_order,
    COALESCE(( SELECT to_jsonb(c.*) AS to_jsonb
           FROM ( SELECT c_1.collection_id,
                    c_1.title,
                    c_1.thumbnail,
                    c_1.parent_collection_id,
                    TRIM(BOTH FROM (COALESCE(parent_call_numbers.item, ''::text) || ' '::text) || COALESCE(c_1.call_number_suffix, ''::text)) AS call_number
                   FROM collections c_1
                     LEFT JOIN list_items parent_call_numbers ON c_1.call_number_id = parent_call_numbers.list_item_id AND parent_call_numbers.type = 'call_number'::text
                  WHERE a.parent_collection_id = c_1.collection_id) c), '{}'::jsonb) AS parent,
    a.is_hidden
   FROM collections a
     LEFT JOIN list_items call_numbers ON call_numbers.type = 'call_number'::text AND a.call_number_id = call_numbers.list_item_id;

--
-- Name: collections_list_items_view; Type: VIEW; Schema: -; Owner: -
--

CREATE OR REPLACE VIEW collections_list_items_view AS
 SELECT b.collection_id,
    a.type,
    to_jsonb(array_agg(to_jsonb(( SELECT i.*::record AS i
           FROM ( SELECT a.list_item_id,
                    a.item) i)) ORDER BY a.item))::jsonb AS items,
    string_agg(a.item, ' ## '::text ORDER BY a.item) AS items_text,
    array_agg(a.item ORDER BY a.item) AS items_search
   FROM list_items a
     JOIN collections_to_list_items b USING (list_item_id)
  GROUP BY b.collection_id, a.type;

--
-- Name: list_items_lookup; Type: VIEW; Schema: -; Owner: -
--

CREATE OR REPLACE VIEW list_items_lookup AS
 SELECT li.list_item_id,
    li.item,
    li.fulltext,
    li.search_text,
    li.type,
    li.description,
    count(DISTINCT r.record_id) AS records_count,
    0 AS collections_count,
    0 AS media_count,
    NULL AS record_type
   FROM list_items li
     LEFT JOIN records_to_list_items r ON li.list_item_id = r.list_item_id
  WHERE li.type = 'author'::text
  GROUP BY li.list_item_id
UNION ALL
 SELECT li.list_item_id,
    li.item,
    li.fulltext,
    li.search_text,
    li.type,
    li.description,
    count(DISTINCT r.record_id) AS records_count,
    count(DISTINCT c.collection_id) AS collections_count,
    0 AS media_count,
    NULL AS record_type
   FROM list_items li
     LEFT JOIN records_to_list_items r ON li.list_item_id = r.list_item_id
     LEFT JOIN collections_to_list_items c ON li.list_item_id = c.list_item_id
  WHERE li.type = 'keyword'::text
  GROUP BY li.list_item_id
UNION ALL
 SELECT li.list_item_id,
    li.item,
    li.fulltext,
    li.search_text,
    li.type,
    li.description,
    count(DISTINCT r.record_id) AS records_count,
    0 AS collections_count,
    0 AS media_count,
    NULL AS record_type
   FROM list_items li
     LEFT JOIN records_to_list_items r ON li.list_item_id = r.list_item_id
  WHERE li.type = 'producer'::text
  GROUP BY li.list_item_id
UNION ALL
 SELECT li.list_item_id,
    li.item,
    li.fulltext,
    li.search_text,
    li.type,
    li.description,
    count(DISTINCT r.record_id) AS records_count,
    count(DISTINCT c.collection_id) AS collections_count,
    0 AS media_count,
    NULL AS record_type
   FROM list_items li
     LEFT JOIN records_to_list_items r ON li.list_item_id = r.list_item_id
     LEFT JOIN collections_to_list_items c ON li.list_item_id = c.list_item_id
  WHERE li.type = 'subject'::text
  GROUP BY li.list_item_id
UNION ALL
 SELECT li.list_item_id,
    li.item,
    li.fulltext,
    li.search_text,
    li.type,
    li.description,
    count(DISTINCT r.record_id) AS records_count,
    0 AS collections_count,
    0 AS media_count,
    NULL AS record_type
   FROM list_items li
     LEFT JOIN records r ON li.list_item_id = r.program_id
  WHERE li.type = 'program'::text
  GROUP BY li.list_item_id
UNION ALL
 SELECT li.list_item_id,
    li.item,
    li.fulltext,
    li.search_text,
    li.type,
    li.description,
    count(DISTINCT r.record_id) AS records_count,
    count(DISTINCT c.collection_id) AS collections_count,
    0 AS media_count,
    NULL AS record_type
   FROM list_items li
     LEFT JOIN records_to_list_items r ON li.list_item_id = r.list_item_id
     LEFT JOIN collections_to_list_items c ON li.list_item_id = c.list_item_id
  WHERE li.type = 'publisher'::text
  GROUP BY li.list_item_id
UNION ALL
 SELECT li.list_item_id,
    li.item,
    li.fulltext,
    li.search_text,
    li.type,
    li.description,
    0 AS records_count,
    0 AS collections_count,
    count(DISTINCT i.media_id) AS media_count,
    frt.record_type::TEXT as record_type
   FROM list_items li
     LEFT JOIN media i ON li.list_item_id = i.format_id
     LEFT JOIN format_record_types frt ON li.list_item_id = frt.list_item_id
  WHERE li.type = 'format'::text
  GROUP BY li.list_item_id, frt.record_type
UNION ALL
 SELECT li.list_item_id,
    li.item,
    li.fulltext,
    li.search_text,
    li.type,
    li.description,
    0 AS records_count,
    0 AS collections_count,
    count(DISTINCT i.media_id) AS media_count,
    NULL AS record_type
   FROM list_items li
     LEFT JOIN media i ON li.list_item_id = i.quality_id
  WHERE li.type = 'quality'::text
  GROUP BY li.list_item_id
UNION ALL
 SELECT li.list_item_id,
    li.item,
    li.fulltext,
    li.search_text,
    li.type,
    li.description,
    0 AS records_count,
    0 AS collections_count,
    count(DISTINCT i.media_id) AS media_count,
    NULL AS record_type
   FROM list_items li
     LEFT JOIN media i ON li.list_item_id = i.generation_id
  WHERE li.type = 'generation'::text
  GROUP BY li.list_item_id
UNION ALL
 SELECT li.list_item_id,
    li.item,
    li.fulltext,
    li.search_text,
    li.type,
    li.description,
    0 AS records_count,
    count(DISTINCT c.collection_id) AS collections_count,
    count(DISTINCT i.media_id) AS media_count,
    NULL AS record_type
   FROM list_items li
     LEFT JOIN collections c ON li.list_item_id = c.call_number_id
     LEFT JOIN media i ON li.list_item_id = i.call_number_id
  WHERE li.type = 'call_number'::text
  GROUP BY li.list_item_id;

--
-- Name: media_view; Type: VIEW; Schema: -; Owner: -
--

CREATE OR REPLACE VIEW media_view AS
 SELECT a.media_id,
    a.archive_id,
    a.call_number_id,
    a.call_number_suffix,
    a.record_id,
    a.format_id,
    a.no_copies,
    a.quality_id,
    a.generation_id,
    a.url,
    a.thumbnail,
    a.creator_user_id,
    a.contributor_user_id,
    a.date_created,
    a.date_modified,
    a.original_doc_id,
    NULLIF(TRIM(BOTH FROM (COALESCE(call_number_lookup.item, ''::text) || ' '::text) || COALESCE(a.call_number_suffix, ''::text)), ''::text) AS call_number,
        CASE
            WHEN call_number_lookup.list_item_id IS NOT NULL THEN jsonb_build_object('item', call_number_lookup.item, 'list_item_id', call_number_lookup.list_item_id)
            ELSE NULL::jsonb
        END AS call_number_item,
        CASE
            WHEN format_lookup.list_item_id IS NOT NULL THEN jsonb_build_object('item', format_lookup.item, 'list_item_id', format_lookup.list_item_id)
            ELSE NULL::jsonb
        END AS format_item,
        CASE
            WHEN quality_lookup.list_item_id IS NOT NULL THEN jsonb_build_object('item', quality_lookup.item, 'list_item_id', quality_lookup.list_item_id)
            ELSE NULL::jsonb
        END AS quality_item,
        CASE
            WHEN generation_lookup.list_item_id IS NOT NULL THEN jsonb_build_object('item', generation_lookup.item, 'list_item_id', generation_lookup.list_item_id)
            ELSE NULL::jsonb
        END AS generation_item,
    (contributor.firstname || ' '::text) || contributor.lastname AS contributor_name,
    contributor.username AS contributor_username,
    (creator.firstname || ' '::text) || creator.lastname AS creator_name,
    creator.username AS creator_username,
    primary_record.record_id IS NOT NULL AS is_primary
   FROM media a
     LEFT JOIN list_items call_number_lookup ON a.call_number_id = call_number_lookup.list_item_id
     LEFT JOIN list_items format_lookup ON a.format_id = format_lookup.list_item_id
     LEFT JOIN list_items quality_lookup ON a.quality_id = quality_lookup.list_item_id
     LEFT JOIN list_items generation_lookup ON a.generation_id = generation_lookup.list_item_id
     LEFT JOIN users contributor ON a.contributor_user_id = contributor.user_id
     LEFT JOIN users creator ON a.creator_user_id = creator.user_id
     LEFT JOIN records primary_record ON a.media_id = primary_record.primary_media_id;

--
-- Name: record_media_view; Type: VIEW; Schema: -; Owner: -
--

CREATE OR REPLACE VIEW record_media_view AS
 SELECT record_id,
    bool_or(url <> ''::text) AS has_digital,
    count(*) AS media_count,
    to_jsonb(array_agg(to_jsonb(a.*) ORDER BY is_primary DESC, media_id)) AS media,
    array_agg(DISTINCT call_number) FILTER (WHERE call_number IS NOT NULL) AS call_numbers,
    string_agg(DISTINCT call_number, ' ## '::text) FILTER (WHERE call_number IS NOT NULL) AS call_numbers_text,
    array_agg(DISTINCT format_id) FILTER (WHERE format_id IS NOT NULL) AS formats,
    array_agg(DISTINCT quality_id) FILTER (WHERE quality_id IS NOT NULL) AS qualitys,
    array_agg(DISTINCT generation_id) FILTER (WHERE generation_id IS NOT NULL) AS generations,
    string_agg(DISTINCT (format_item->'item')::text, ' ## '::text) FILTER (WHERE format_item IS NOT NULL) AS formats_text
   FROM media_view a
  GROUP BY record_id;

--
-- Name: record_summaries; Type: VIEW; Schema: -; Owner: -
--

CREATE OR REPLACE VIEW record_summaries AS
 SELECT a.record_id,
    a.title,
    a.parent_record_id,
    primary_media.thumbnail AS primary_media_thumbnail,
    primary_media.format_id AS primary_media_format_id,
    list_items.item AS primary_media_format_text,
    frt.record_type::TEXT AS record_type,
    COALESCE(( SELECT to_jsonb(c.*) AS to_jsonb
           FROM collection_summaries c
          WHERE a.collection_id = c.collection_id), '{}'::jsonb) AS collection
   FROM records a
     LEFT JOIN media primary_media ON a.primary_media_id = primary_media.media_id
     LEFT JOIN list_items ON primary_media.format_id = list_items.list_item_id AND list_items.type = 'format'::text
     LEFT JOIN format_record_types frt ON primary_media.format_id = frt.list_item_id;

--
-- Name: records_list_items_view; Type: VIEW; Schema: -; Owner: -
--

CREATE OR REPLACE VIEW records_list_items_view AS
 SELECT b.record_id,
    a.type,
    to_jsonb(array_agg(to_jsonb(( SELECT i.*::record AS i
           FROM ( SELECT a.list_item_id,
                    a.item) i)) ORDER BY a.item))::jsonb AS items,
    string_agg(a.item, ' ## '::text ORDER BY a.item) AS items_text,
    array_agg(a.item ORDER BY a.item) AS items_search,
    array_agg(a.list_item_id ORDER BY a.item) AS item_ids
   FROM list_items a
     JOIN records_to_list_items b USING (list_item_id)
  GROUP BY b.record_id, a.type;

--
-- Name: unified_collections; Type: VIEW; Schema: -; Owner: -
--

CREATE OR REPLACE VIEW unified_collections AS
 SELECT a.collection_id,
    a.archive_id,
    a.parent_collection_id,
    a.title,
    a.description,
    a.description_search,
    a.summary,
    a.call_number_id,
    a.call_number_suffix,
    a.notes,
    a.thumbnail,
    a.display_order,
    a.date_range,
    a.needs_review,
    a.is_hidden,
    a.creator_user_id,
    a.contributor_user_id,
    a.date_created,
    a.date_modified,
    NULLIF(TRIM(BOTH FROM (COALESCE(call_numbers.item, ''::text) || ' '::text) || COALESCE(a.call_number_suffix, ''::text)), ''::text) AS call_number,
    (contributor.firstname || ' '::text) || contributor.lastname AS contributor_name,
    contributor.username AS contributor_username,
    (creator.firstname || ' '::text) || creator.lastname AS creator_name,
    creator.username AS creator_username,
        CASE
            WHEN call_numbers.list_item_id IS NOT NULL THEN jsonb_build_object('item', call_numbers.item, 'list_item_id', call_numbers.list_item_id)
            ELSE NULL::jsonb
        END AS call_number_item,
    COALESCE(publishers.items, '[]'::jsonb) AS publishers,
    COALESCE(subjects.items, '[]'::jsonb) AS subjects,
    COALESCE(keywords.items, '[]'::jsonb) AS keywords,
    subjects.items_text AS subjects_text,
    keywords.items_text AS keywords_text,
    publishers.items_text AS publishers_text,
    subjects.items_search AS subjects_search,
    keywords.items_search AS keywords_search,
    publishers.items_search AS publishers_search,
    to_jsonb(ARRAY( SELECT jsonb_build_object('record_id', b.record_id, 'title', b.title, 'parent_record_id', b.parent_record_id, 'primary_media_thumbnail', primary_media.thumbnail, 'primary_media_format_id', primary_media.format_id, 'primary_media_format_text', list_items.item, 'record_type', frt.record_type) AS jsonb_build_object
           FROM records b
             LEFT JOIN media primary_media ON b.primary_media_id = primary_media.media_id
             LEFT JOIN list_items ON primary_media.format_id = list_items.list_item_id AND list_items.type = 'format'::text
             LEFT JOIN format_record_types frt ON primary_media.format_id = frt.list_item_id
          WHERE a.collection_id = b.collection_id
          ORDER BY b.title)) AS child_records,
    to_jsonb(ARRAY( SELECT jsonb_build_object('record_id', b.record_id, 'title', b.title, 'parent_record_id', b.parent_record_id, 'primary_media_thumbnail', primary_media.thumbnail, 'primary_media_format_id', primary_media.format_id, 'primary_media_format_text', list_items.item, 'record_type', frt.record_type, 'primary_media_url', primary_media.url, 'label', f.label, 'record_order', f.record_order) AS jsonb_build_object
           FROM records b
             LEFT JOIN featured_records f ON b.record_id = f.record_id
             LEFT JOIN media primary_media ON b.primary_media_id = primary_media.media_id
             LEFT JOIN list_items ON primary_media.format_id = list_items.list_item_id AND list_items.type = 'format'::text
             LEFT JOIN format_record_types frt ON primary_media.format_id = frt.list_item_id
          WHERE a.collection_id = f.collection_id
          ORDER BY f.record_order, b.title)) AS featured_records,
    (
      setweight(to_tsvector('english'::regconfig, COALESCE(a.title, ''::text)), 'A'::"char") ||
      setweight(to_tsvector('simple'::regconfig,
        CASE
            WHEN call_numbers.item IS NULL THEN ''::text
            ELSE TRIM(BOTH FROM (call_numbers.item || ' '::text) || COALESCE(a.call_number_suffix, ''::text))
        END), 'A'::"char") ||
      setweight(to_tsvector('english'::regconfig, COALESCE(a.summary, ''::text)), 'B'::"char") ||
      setweight(to_tsvector('english'::regconfig, COALESCE(a.description_search, ''::text)), 'B'::"char") ||
      setweight(to_tsvector('english'::regconfig, COALESCE(keywords.items_text, ''::text)), 'C'::"char") ||
      setweight(to_tsvector('english'::regconfig, COALESCE(subjects.items_text, ''::text)), 'C'::"char") 
    ) AS fulltext,
    lower(
      regexp_replace(
        concat_ws(
          ' ## ',
          nullif(a.title, ''),                
          nullif(call_numbers.item, ''),
          nullif(a.call_number_suffix, ''),
          nullif(a.summary, ''),
          nullif(a.description_search, ''),
          nullif(keywords.items_text, ''),
          nullif(subjects.items_text, '')
        ),
        '\s+',
        ' ',
        'g'
      )
    ) AS search_text,
    COALESCE(( SELECT to_jsonb(p.*) AS to_jsonb
           FROM collection_summaries p
          WHERE a.parent_collection_id = p.collection_id), '{}'::jsonb) AS parent,
    ARRAY( SELECT to_jsonb(collection_summaries.*) AS to_jsonb
           FROM collection_summaries
          WHERE collection_summaries.parent_collection_id = a.collection_id
          ORDER BY collection_summaries.display_order) AS children,
    d.descendant_ids AS descendant_collection_ids,
    ancestors.ancestors
   FROM collections a
     LEFT JOIN collection_summaries b USING (collection_id)
        LEFT JOIN users contributor ON a.contributor_user_id = contributor.user_id
     LEFT JOIN users creator ON a.creator_user_id = creator.user_id
     LEFT JOIN collections_list_items_view subjects ON subjects.type = 'subject'::text AND subjects.collection_id = a.collection_id
     LEFT JOIN collections_list_items_view keywords ON keywords.type = 'keyword'::text AND keywords.collection_id = a.collection_id
     LEFT JOIN list_items call_numbers ON call_numbers.type = 'call_number'::text AND a.call_number_id = call_numbers.list_item_id
     LEFT JOIN collections_list_items_view publishers ON publishers.type = 'publisher'::text AND publishers.collection_id = a.collection_id
     LEFT JOIN LATERAL ( WITH RECURSIVE d AS (
                 SELECT collections.collection_id
                   FROM collections
                  WHERE collections.collection_id = a.collection_id
                UNION ALL
                 SELECT c.collection_id
                   FROM collections c
                     JOIN d d_2 ON c.parent_collection_id = d_2.collection_id
                )
         SELECT array_agg(d_1.collection_id ORDER BY d_1.collection_id) FILTER (WHERE d_1.collection_id <> a.collection_id) AS descendant_ids
           FROM d d_1) d ON true
     LEFT JOIN LATERAL ( WITH RECURSIVE ancestors_cte AS (
                 SELECT cs.collection_id,
                    cs.title,
                    cs.parent_collection_id,
                    1 AS level
                   FROM collection_summaries cs
                  WHERE cs.collection_id = a.parent_collection_id
                UNION ALL
                 SELECT cs.collection_id,
                    cs.title,
                    cs.parent_collection_id,
                    ac.level + 1
                   FROM collection_summaries cs
                     JOIN ancestors_cte ac ON cs.collection_id = ac.parent_collection_id
                )
         SELECT jsonb_agg(jsonb_build_object('collection_id', ancestors_cte.collection_id, 'title', ancestors_cte.title) ORDER BY ancestors_cte.level DESC) AS ancestors
           FROM ancestors_cte) ancestors ON true;

--
-- Name: related_records; Type: TABLE; Schema: -; Owner: -
--

CREATE TABLE IF NOT EXISTS related_records (
    id integer,
    docid_1 integer,
    docid_2 integer,
    title_1 text,
    description_1 text,
    track_number_1 integer,
    title_2 text,
    description_2 text,
    track_number_2 integer,
    record_id_1 integer,
    record_id_2 integer,
    CONSTRAINT related_records_record_id_1_fkey FOREIGN KEY (record_id_1) REFERENCES freedom_archives.records (record_id) ON DELETE CASCADE,
    CONSTRAINT related_records_record_id_2_fkey FOREIGN KEY (record_id_2) REFERENCES freedom_archives.records (record_id) ON DELETE CASCADE,
    CONSTRAINT related_records_pkey PRIMARY KEY (id)

);

CREATE INDEX IF NOT EXISTS related_records_record_id_1_idx ON related_records (record_id_1);
CREATE INDEX IF NOT EXISTS related_records_record_id_2_idx ON related_records (record_id_2);
--
-- Name: unified_records; Type: VIEW; Schema: -; Owner: -
--

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
    (
      setweight(to_tsvector('english'::regconfig, COALESCE(a.title, ''::text)), 'A'::"char") ||
      setweight(to_tsvector('simple'::regconfig, COALESCE(media.call_numbers_text, ''::text)), 'A'::"char") ||
      setweight(to_tsvector('english'::regconfig, COALESCE(a.description, ''::text)), 'B'::"char") ||
      setweight(to_tsvector('simple'::regconfig, COALESCE(authors.items_text, ''::text)), 'C'::"char") || 
      setweight(to_tsvector('english'::regconfig, COALESCE(subjects.items_text, ''::text)), 'C'::"char") || 
      setweight(to_tsvector('english'::regconfig, COALESCE(keywords.items_text, ''::text)), 'C'::"char") ||
      setweight(to_tsvector('simple'::regconfig, COALESCE(producers.items_text, ''::text)), 'C'::"char") || 
      setweight(to_tsvector('simple'::regconfig, COALESCE(publishers.items_text, ''::text)), 'C'::"char") ||
      setweight(to_tsvector('english'::regconfig, COALESCE(media.formats_text, ''::text)), 'C'::"char")
    ) AS fulltext,
    lower(
      regexp_replace(
        concat_ws(
          ' ## ',
          nullif(a.title, ''),                
          nullif(a.description, ''),
          nullif(media.call_numbers_text, ''),
          nullif(authors.items_text, ''),
          nullif(subjects.items_text, ''),
          nullif(keywords.items_text, ''),
          nullif(producers.items_text, ''),
          nullif(publishers.items_text, ''),
          nullif(media.formats_text, '')
        ),
        '\s+',
        ' ',
        'g'
      )
    ) AS search_text,
    b.primary_media_thumbnail,
    b.primary_media_format_id,
    b.primary_media_format_text,
    frt.record_type::TEXT AS record_type,
    b.collection,
    children.children,
    siblings.siblings,
    parent.parent,
    continuations.continuations,
    a.fact_number,
    b.collection->>'title' AS collection_title,
    relationships.relationships AS relationships,
    (
      COALESCE(
        ARRAY (
          SELECT
            JSONB_ARRAY_ELEMENTS_TEXT(
              JSONB_PATH_QUERY_ARRAY(c.ancestors, '$[*].collection_id')
            )::INT
        ),
        '{}'::INT[]
      )||ARRAY[c.collection_id]
    ) AS ancestor_collection_ids,
    authors.item_ids AS author_ids,
    subjects.item_ids AS subject_ids,
    keywords.item_ids AS keyword_ids,
    producers.item_ids AS producer_ids,
    publishers.item_ids AS publisher_ids
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
    LEFT JOIN LATERAL (
      SELECT jsonb_agg(to_jsonb(rr.*)) AS relationships
      FROM related_records rr
      WHERE rr.record_id_1 = a.record_id OR (rr.record_id_2 = a.record_id AND rr.record_id_1 <> a.record_id)
    ) relationships ON true
     LEFT JOIN LATERAL ( SELECT array_agg(to_jsonb(record_summaries.*) ORDER BY record_summaries.title) AS children
           FROM record_summaries
          WHERE record_summaries.parent_record_id = a.record_id) children ON true
     LEFT JOIN LATERAL ( SELECT array_agg(to_jsonb(record_summaries.*) ORDER BY record_summaries.title) AS siblings
           FROM record_summaries
          WHERE record_summaries.parent_record_id = a.parent_record_id AND record_summaries.record_id <> a.record_id) siblings ON true
     LEFT JOIN LATERAL ( SELECT COALESCE(array_agg(to_jsonb(cr.*) ORDER BY (array_position(c.continuation_records, cr.record_id))), '{}'::jsonb[]) AS continuations
           FROM continuations c,
            LATERAL unnest(c.continuation_records) WITH ORDINALITY rid(rid, ordinality)
             JOIN record_summaries cr ON rid.rid = cr.record_id
          WHERE a.record_id = ANY (c.continuation_records)) continuations ON true
     CROSS JOIN LATERAL ( SELECT COALESCE(to_jsonb(parent_record.*), NULL::jsonb) AS parent) parent;

--
-- Name: review_changes; Type: VIEW; Schema: -; Owner: -
--

CREATE OR REPLACE VIEW review_changes AS
 SELECT unified_records.record_id AS id,
    unified_records.collection_id,
    unified_records.title,
    'record'::text AS type,
        CASE
            WHEN unified_records.date_created = unified_records.date_modified THEN 'create'::text
            ELSE 'update'::text
        END AS action,
    COALESCE(unified_records.date_modified, unified_records.date_created) AS date_modified,
    unified_records.needs_review,
    unified_records.contributor_user_id,
    unified_records.contributor_name
   FROM _unified_records AS unified_records
  WHERE unified_records.date_modified IS NOT NULL
UNION
 SELECT unified_collections.collection_id AS id,
    unified_collections.collection_id,
    unified_collections.title,
    'collection'::text AS type,
        CASE
            WHEN unified_collections.date_created = unified_collections.date_modified THEN 'create'::text
            ELSE 'update'::text
        END AS action,
    COALESCE(unified_collections.date_modified, unified_collections.date_created) AS date_modified,
    unified_collections.needs_review,
    unified_collections.contributor_user_id,
    unified_collections.contributor_name
   FROM _unified_collections AS unified_collections 
  WHERE unified_collections.date_modified IS NOT NULL;

--
-- Name: unified_search_view; Type: VIEW; Schema: -; Owner: -
--

CREATE OR REPLACE VIEW unified_search_view AS
 SELECT 'record'::text AS result_type,
    unified_records.record_id AS id,
    unified_records.title,
    unified_records.collection,
    unified_records.date_modified,
    unified_records.description,
    unified_records.search_text,
    unified_records.fulltext,
    unified_records.call_numbers,
    array_to_string(unified_records.call_numbers, ' '::text) AS call_number_text,
    unified_records.record_type,
    unified_records.has_digital,
    NULL::text AS thumbnail
   FROM _unified_records AS unified_records
UNION ALL
 SELECT 'collection'::text AS result_type,
    unified_collections.collection_id AS id,
    unified_collections.title,
    unified_collections.parent AS collection,
    unified_collections.date_modified,
    unified_collections.description,
    unified_collections.search_text,
    unified_collections.fulltext,
        CASE
            WHEN unified_collections.call_number IS NOT NULL THEN ARRAY[unified_collections.call_number]
            ELSE ARRAY[]::text[]
        END AS call_numbers,
    unified_collections.call_number AS call_number_text,
    NULL::text AS record_type,
    true AS has_digital,
    unified_collections.thumbnail
   FROM _unified_collections AS unified_collections;


CREATE TABLE
  freedom_archives.duplicate_records_ignore (
    record_id_1 INTEGER,
    record_id_2 INTEGER,
    CONSTRAINT duplicate_records_ignore_pkey PRIMARY KEY (record_id_1, record_id_2),
    CONSTRAINT duplicate_records_ignore_record_1_fkey FOREIGN KEY (record_id_1) REFERENCES freedom_archives.records (record_id) ON DELETE CASCADE,
    CONSTRAINT duplicate_records_ignore_record_2_fkey FOREIGN KEY (record_id_2) REFERENCES freedom_archives.records (record_id) ON DELETE CASCADE
  );

CREATE VIEW
  freedom_archives.duplicate_records AS
SELECT
  a.record_id||'|'||b.record_id AS duplicate_record_id,
  a.record_id AS record_id_1,
  b.record_id AS record_id_2,
  a.title AS title_1,
  b.title AS title_2,
  a.collection_title AS collection_1,
  b.collection_title AS collection_2,
  ROUND(
    (
      similarity (
        JSONB_BUILD_OBJECT(
          'title',
          a.title,
          'description',
          a.description,
          'authors',
          a.authors_text,
          'producers',
          a.producers_text,
          'keywords',
          a.keywords_text,
          'subjects',
          a.subjects_text,
          'collection',
          a.collection_title,
          'vol_number',
          a.vol_number,
          'program',
          a.program,
          'publishers',
          a.publishers_text,
          'location',
          a.location,
          'date',
          a.date_string,
          'fact_number',
          a.fact_number,
          'notes',
          a.notes
        )::TEXT,
        JSONB_BUILD_OBJECT(
          'title',
          b.title,
          'description',
          b.description,
          'authors',
          b.authors_text,
          'producers',
          b.producers_text,
          'keywords',
          b.keywords_text,
          'subjects',
          b.subjects_text,
          'collection',
          b.collection_title,
          'vol_number',
          b.vol_number,
          'program',
          b.program,
          'publishers',
          b.publishers_text,
          'location',
          b.location,
          'date',
          b.date_string,
          'fact_number',
          b.fact_number,
          'notes',
          b.notes
        )::TEXT
      )
    )::NUMERIC,
    3
  ) AS relevance,
  a.fulltext||b.fulltext AS fulltext,
  a.call_numbers AS call_numbers_1,
  b.call_numbers AS call_numbers_2,
  a.search_text||b.search_text AS search_text,
  EXISTS (
    SELECT
      1
    FROM
      freedom_archives.duplicate_records_ignore dri
    WHERE
      (dri.record_id_1=a.record_id
      AND dri.record_id_2=b.record_id) OR
      (dri.record_id_1=b.record_id
      AND dri.record_id_2=a.record_id)
  ) AS is_ignored
FROM
  _unified_records a
  JOIN _unified_records b ON a.title=b.title
  AND a.date=b.date
  AND a.record_id<b.record_id;


CREATE TABLE
freedom_archives.duplicate_list_items_ignore (
  list_item_id_1 INTEGER,
  list_item_id_2 INTEGER,
  CONSTRAINT duplicate_list_items_ignore_pkey PRIMARY KEY (list_item_id_1, list_item_id_2),
  CONSTRAINT duplicate_list_items_ignore_list_item_1_fkey FOREIGN KEY (list_item_id_1) REFERENCES freedom_archives.list_items (list_item_id) ON DELETE CASCADE,
  CONSTRAINT duplicate_list_items_ignore_list_item_2_fkey FOREIGN KEY (list_item_id_2) REFERENCES freedom_archives.list_items (list_item_id) ON DELETE CASCADE
);

CREATE VIEW freedom_archives.duplicate_list_items_view AS
SELECT
  a.list_item_id||'|'||b.list_item_id AS duplicate_list_item_id,
  a.list_item_id AS list_item_id_1,
  b.list_item_id AS list_item_id_2,
  a.item        AS item_1,
  b.item        AS item_2,
  a.archive_id,
  a.type,  
  s.sim,
  c.records_count AS records_count_1,
  c.collections_count AS collections_count_1,
  c.media_count AS media_count_1,
  d.records_count AS records_count_2,
  d.collections_count AS collections_count_2,
  d.media_count AS media_count_2,
  EXISTS (
    SELECT 1
    FROM freedom_archives.duplicate_list_items_ignore dli
    WHERE (dli.list_item_id_1 = a.list_item_id AND dli.list_item_id_2 = b.list_item_id)
       OR (dli.list_item_id_1 = b.list_item_id AND dli.list_item_id_2 = a.list_item_id)
) as is_ignored
FROM freedom_archives.list_items a
JOIN freedom_archives.list_items b
  ON  b.archive_id   = a.archive_id
  AND b.type         = a.type
  AND b.list_item_id > a.list_item_id
  AND a.search_text % b.search_text
JOIN list_items_lookup c
  ON c.list_item_id = a.list_item_id
JOIN list_items_lookup d
  ON d.list_item_id = b.list_item_id
CROSS JOIN LATERAL (
  SELECT similarity(a.search_text, b.search_text) AS sim
) s
ORDER BY s.sim DESC;

CREATE TABLE duplicate_list_items (
  duplicate_list_item_id TEXT NOT NULL,
  list_item_id_1 INTEGER NOT NULL,
  list_item_id_2 INTEGER NOT NULL,
  item_1 TEXT NOT NULL,
  item_2 TEXT NOT NULL,
  archive_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  sim NUMERIC NOT NULL,
  records_count_1 INTEGER NOT NULL,
  collections_count_1 INTEGER NOT NULL, 
  media_count_1 INTEGER NOT NULL,
  records_count_2 INTEGER NOT NULL,
  collections_count_2 INTEGER NOT NULL,
  media_count_2 INTEGER NOT NULL,
  is_ignored BOOLEAN NOT NULL,
  CONSTRAINT duplicate_list_items_pkey PRIMARY KEY (duplicate_list_item_id),
  CONSTRAINT duplicate_list_items_list_item_1_fkey FOREIGN KEY (list_item_id_1) REFERENCES freedom_archives.list_items (list_item_id) ON DELETE CASCADE,
  CONSTRAINT duplicate_list_items_list_item_2_fkey FOREIGN KEY (list_item_id_2) REFERENCES freedom_archives.list_items (list_item_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS duplicate_list_items_sim_idx
  ON freedom_archives.duplicate_list_items (type, is_ignored, sim DESC);

CREATE INDEX IF NOT EXISTS duplicate_list_items_id_1_idx 
  ON freedom_archives.duplicate_list_items (type, archive_id, list_item_id_1, list_item_id_2);

-- CREATE INDEX IF NOT EXISTS duplicate_records_similarity_idx 
--   ON duplicate_records (similarity_score DESC);

--   CREATE INDEX IF NOT EXISTS duplicate_records_id_1_idx 
--   ON duplicate_records (id_1);

-- CREATE INDEX IF NOT EXISTS duplicate_records_id_2_idx 
--   ON duplicate_records (id_2);

-- CREATE INDEX IF NOT EXISTS duplicate_records_title_similarity_idx 
--   ON duplicate_records (title_1, similarity_score DESC);