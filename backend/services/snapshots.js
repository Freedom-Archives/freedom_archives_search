import { KnexService } from "@feathersjs/knex";
import path from "path";
import { fileURLToPath } from "url";

import { setArchive } from "./common_hooks/index.js";
import { generateAndSaveSitemap } from "./sitemap.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LIVE_SNAPSHOT_TITLE = "Public Data";
class Snapshots extends KnexService {
  constructor(options) {
    super({
      ...options,
      name: "snapshots",
    });
  }
}

const collections_filter = /* sql */ `
  COALESCE(ARRAY_LENGTH(c.descendant_collection_ids, 1), 0)+COALESCE(JSONB_ARRAY_LENGTH(c.child_records), 0)!=0
  AND c.is_hidden=FALSE
  AND c.needs_review=FALSE
`;

const records_select_query = /* sql */ `
SELECT
  r.archive_id,
  r.record_id,
  r.title,
  r.description,
  r.vol_number,
  r.has_digital,
  r.date_modified,
  r.date,
  r.primary_media_format_text AS FORMAT,
  i.url AS url,
  i.thumbnail AS thumbnail,
  i.call_number AS call_number,
  r.year,
  (
    SELECT
      ARRAY_AGG(DISTINCT (VALUE->>'list_item_id')::INTEGER)
    FROM
      JSONB_ARRAY_ELEMENTS(r.subjects) AS VALUE
  ) AS subject_ids,
  (
    SELECT
      ARRAY_AGG(DISTINCT (VALUE->>'list_item_id')::INTEGER)
    FROM
      JSONB_ARRAY_ELEMENTS(r.authors) AS VALUE
  ) AS author_ids,
  (
    SELECT
      ARRAY_AGG(DISTINCT (VALUE->>'list_item_id')::INTEGER)
    FROM
      JSONB_ARRAY_ELEMENTS(r.keywords) AS VALUE
  ) AS keyword_ids,
  (
    SELECT
      ARRAY_AGG(DISTINCT (VALUE->>'list_item_id')::INTEGER)
    FROM
      JSONB_ARRAY_ELEMENTS(r.producers) AS VALUE
  ) AS producer_ids,
  (
    SELECT
      ARRAY_AGG(DISTINCT (VALUE->>'list_item_id')::INTEGER)
    FROM
      JSONB_ARRAY_ELEMENTS(r.publishers) AS VALUE
  ) AS publisher_ids,
  (r.program->>'list_item_id')::INTEGER AS program_id,
  r.collection_id,
  r.fulltext,
  r.search_text,
  r.ancestor_collection_ids,
  r.record_type AS record_type
FROM
  _unified_records r
  JOIN _unified_collections c USING (collection_id)
  JOIN media_view i ON r.primary_media_id=i.media_id
WHERE
  r.is_hidden=FALSE
  AND r.needs_review=FALSE
  AND r.record_type != 'Other'
  AND ${collections_filter}
  `;

const records_to_list_items_select_query = /* sql */ `
SELECT
  r.archive_id,
  l.list_item_id,
  r.record_id
FROM
  (${records_select_query}) r
  JOIN records_to_list_items l USING (record_id)
UNION
SELECT DISTINCT
  r.archive_id,
  l.list_item_id,
  r.record_id
FROM
  media i
  JOIN media_to_list_items l USING (media_id)
  JOIN (${records_select_query}) r USING (record_id)
`;

const public_tables = {
  records: {
    deleteQuery: /* sql */ `
DELETE FROM public_search.records_snapshot
WHERE
  record_id NOT IN (
    SELECT
      record_id
    FROM
      records r
      JOIN _unified_collections c USING (collection_id)
    WHERE
      r.is_hidden=FALSE
      AND r.needs_review=TRUE
      AND ${collections_filter}
  )`,
    selectQuery: records_select_query,
  },
  collections: {
    deleteQuery: `delete from public_search.collections_snapshot where collection_id
    not in (select collection_id from collections c where c.is_hidden = false and c.needs_review = true)`,
    selectQuery: /* sql */ `
SELECT
	c.archive_id,
	c.collection_id,
	c.title,
	c.description,
	c.summary,
	c.thumbnail,
	c.date_modified,
  c.descendant_collection_ids,
	c.featured_records,
	c.keywords,
	c.date_range,
	c.ancestors,
	'[]'::JSONB AS children,
	c.display_order,
  c.parent_collection_id,
  c.fulltext,
  c.search_text
FROM
	_unified_collections c
WHERE
	${collections_filter}
    `,
  },
  list_items: {
    selectQuery: /* sql */ `
   SELECT DISTINCT
      li.list_item_id,
      r.archive_id,
      li.item,
      li.fulltext,
      li.search_text,
      li.type,
      li.description
    FROM
      (${records_to_list_items_select_query}) r
      JOIN list_items li USING (list_item_id)
    `,
  },
  records_to_list_items: {
    selectQuery: records_to_list_items_select_query,
  },
  featured_records: {},
  config: {},
};

const restoreSnapshot = async (context) => {
  const {
    params: {
      transaction: { trx },
    },
    id,
  } = context;
  const { archive_id, snapshot_id, title, ...data } = await trx("snapshots").where({ snapshot_id: id }).first();
  delete data.is_live;
  for (const table of Object.keys(public_tables)) {
    const columns = await trx(`${table}_snapshots`)
      .columnInfo()
      .then((info) => Object.keys(info).filter((col) => col !== "snapshot_id"));
    await trx(`public_search.${table}`).where({ archive_id }).delete();
    await trx(`public_search.${table}`).insert(
      trx(`${table}_snapshots`).select(columns).where({ snapshot_id }).select(),
    );
  }
  await trx("snapshots").where({ title: LIVE_SNAPSHOT_TITLE, archive_id }).update(data);
  context.result = { snapshot_id, title, ...data };
};

const publishSite = async (context) => {
  const {
    params: {
      transaction: { trx },
    },
    result: { snapshot_id },
    data,
  } = context;
  const { archive_id } = data;
  for (const table of Object.keys(public_tables)) {
    // console.time(`copy ${table}`);
    const target = `${table}_snapshots`;
    await trx(target).insert(trx(`public_search.${table}`).select([snapshot_id, "*"]).where({ archive_id }));
    // console.timeEnd(`copy ${table}`);
  }
  for (const [table, { selectQuery }] of Object.entries(public_tables)) {
    // console.time(`delete ${table}`);
    const deleteQuery = trx(`public_search.${table}`).where({ archive_id });
    if (table == "records") {
      deleteQuery.whereNotIn(
        "record_id",
        trx("records")
          .join("collections", { "records.collection_id": "collections.collection_id" })
          .where({ "records.is_hidden": false, "collections.is_hidden": false, "records.needs_review": true })
          .select("record_id"),
      );
    } else if (table === "collections") {
      deleteQuery.whereNotIn(
        "collection_id",
        trx("collections").where({ is_hidden: false, needs_review: true }).select("collection_id"),
      );
    } else if (table === "records_to_list_items") {
      deleteQuery.whereNotIn(
        "record_id",
        trx("records")
          .join("collections", { "records.collection_id": "collections.collection_id" })
          .where({ "records.is_hidden": false, "collections.is_hidden": false, "records.needs_review": true })
          .select("record_id"),
      );
    }
    await deleteQuery.delete();
    // console.timeEnd(`delete ${table}`);
    // console.time(`update ${table}`);
    await trx(`public_search.${table}`).insert(
      trx
        .fromRaw(selectQuery ? `(${selectQuery})` : table)
        .select()
        .where({ archive_id }),
      // trx(selectTarget || table)
      //   .where({ archive_id })
      //   .select()
    );

    await trx("public_search.collections")
      .where({ archive_id })
      .update({
        children: trx.raw(
          `(
        SELECT
          COALESCE(
            JSONB_AGG(
              JSONB_BUILD_OBJECT(
                'title', b.title,
                'collection_id', b.collection_id,
                'summary', b.summary,
                'thumbnail', b.thumbnail,
                'display_order', b.display_order,
                'children',
                  (
                    SELECT
                      JSONB_AGG(
                        JSONB_BUILD_OBJECT(
                          'title', c.title,
                          'collection_id', c.collection_id
                        )
                        ORDER BY c.display_order
                      )
                    FROM public_search.collections c
                    WHERE c.parent_collection_id = b.collection_id
                  )
              )
              ORDER BY b.display_order
            ) FILTER (WHERE b.collection_id IS NOT NULL),
            '[]'::JSONB
          )
        FROM public_search.collections b
        WHERE b.parent_collection_id = public_search.collections.collection_id
      )`,
        ),
      });
  }

  await trx("snapshots").where({ title: "Snapshot 3", archive_id }).delete();
  await trx("snapshots").where({ archive_id, title: "Snapshot 2" }).update({ title: "Snapshot 3" });
  await trx("snapshots").where({ archive_id, title: "Snapshot 1" }).update({ title: "Snapshot 2" });
  await trx("snapshots")
    .whereNot({ snapshot_id })
    .andWhere({ archive_id, title: LIVE_SNAPSHOT_TITLE })
    .update({ title: "Snapshot 1" });
  const metadata = {};
  for (const type of ["record", "collection"]) {
    const { count, date } = await trx(`public_search.${type}s`)
      .count(`${type}_id`)
      .max("date_modified as date")
      .first();
    metadata[`${type}s_count`] = parseInt(count, 10);
    metadata[`max_${type}_date`] = date;
  }
  await trx("snapshots").where({ snapshot_id }).update(metadata);
  return context;
};

const cacheConfig = async (context) => {
  const {
    params: {
      transaction: { trx },
    },
    data: { archive_id },
  } = context;

  const keywords = (
    await trx("list_items")
      .select(trx.raw("jsonb_build_array(item, count(*)) as value"))
      .join("records_to_list_items AS rti", "list_items.list_item_id", "rti.list_item_id")
      .where({ archive_id })
      .groupBy("item")
      .orderBy(trx.raw("count(*)"), "desc")
      .limit(30)
  ).map(({ value }) => value);

  const collection = await trx("_unified_collections")
    .select(
      trx.raw(`jsonb_path_query_array(array_to_json(children)::jsonb, '$[*] \\? (@.is_hidden == false)') as children`),
      "featured_records",
    )
    .where({ archive_id, collection_id: 0 });
  await trx(`public_search.config`).insert([
    { archive_id, setting: "topKeywords", value: JSON.stringify(keywords) },
    { archive_id, setting: "topCollection", value: JSON.stringify(collection[0]) },
  ]);
};

const analyzeSnapshot = async ({ service }) => {
  await service.getModel().raw(`VACUUM ANALYZE ${Object.keys(public_tables).join(", ")}`);
};

const writeSitemap = async (context) => {
  const publicPath = path.resolve(__dirname, "..", context.app.get("public"));
  await generateAndSaveSitemap(context.app, { publicPath });
  return context;
};

export default (function (app) {
  const options = {
    id: "snapshot_id",
    Model: app.get("postgresqlClient"),
  };
  app.use("/api/snapshots", new Snapshots(options), { methods: ["create", "find", "patch"] });
  const service = app.service("api/snapshots");
  service.hooks({
    before: {
      all: [],
      create: [
        setArchive,
        (context) => {
          context.data.title = LIVE_SNAPSHOT_TITLE;
          return context;
        },
      ],
      find: [
        (context) => {
          context.params.query.$sort ||= { is_live: -1, date_published: -1 };
        },
      ],
      patch: [restoreSnapshot],
    },
    after: {
      create: [publishSite, cacheConfig, analyzeSnapshot, writeSitemap],
      patch: [analyzeSnapshot, writeSitemap],
    },
    error: {
      create: [],
      patch: [],
    },
  });
});
