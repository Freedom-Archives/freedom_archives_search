import { KnexService } from "@feathersjs/knex";
import { readdir } from "fs/promises";
import path from "path";


const queries = {
  'missing_description': `
        SELECT 
          record_id,
          title
        FROM records
        WHERE description IS NULL OR TRIM(description) = ''
        ORDER BY record_id
      `,
  // 'invalid_dates': `
  //       SELECT
  //         year,
  //         record_id,
  //         title
  //       FROM records a
  //       WHERE  a.year < 1900
  //         OR a.year > 2025
  //       ORDER BY record_id
  //     `,
  'missing_format': `
        SELECT DISTINCT
          coalesce(a.call_number, '') as call_number,
          record_id,
          b.title,
          a.media_id
        FROM media_view a
        LEFT JOIN records b using (record_id)
        WHERE format_id is null
        ORDER BY record_id
      `,
  'missing_copy_number': `
        SELECT DISTINCT
          coalesce(a.call_number, '') as call_number,
          record_id,
          b.title,
          a.media_id
        FROM media_view a
        LEFT JOIN records b using (record_id)
        WHERE no_copies is null or no_copies = 0
        ORDER BY record_id
      `,
  // 'invalid_call_numbers': "SELECT DISTINCT a.call_number, record_id, b.title FROM media_view a LEFT JOIN records b using (record_id) WHERE call_number_suffix !~ '^[0-9.]{1,5}([A-Z]| +R[0-9])?$' or call_number_suffix is null order by call_number, record_id",
  'invalid_call_numbers': "SELECT DISTINCT a.call_number, record_id, b.title FROM media_view a LEFT JOIN records b using (record_id) WHERE call_number_suffix is null order by call_number, record_id",
  'duplicate_call_numbers': `
        SELECT 
          coalesce(call_number, '') as call_number,
          array_agg(distinct jsonb_build_object('record_id', record_id, 'title', title)) as records,
          count(distinct record_id)::int as record_count
        FROM media_view
        JOIN records using (record_id)
        WHERE call_number != '' 
        GROUP BY call_number 
        HAVING count(*) > 1
        ORDER BY count(*) DESC, call_number
      `,
  'invalid_url': `
          SELECT DISTINCT
          coalesce(a.call_number, '') as call_number,
  record_id,
  b.title,
  a.media_id,
  a.url
        FROM media_view a
        LEFT JOIN records b using(record_id)
        WHERE url IS NOT NULL AND url != '' AND url !~ '^https\\?://[a-zA-Z0-9:.-]+/'
        ORDER BY record_id
  `,
  'missing_title': `
        SELECT 
          record_id
        FROM records
        WHERE title IS NULL OR TRIM(title) = ''
        ORDER BY record_id
      ` ,
  'missing_thumbnails': async function ({ app }) {
    const thumbnailDir = path.join(app.get('publicPath'), "img", "thumbnails", "records");
    const files = await readdir(thumbnailDir).then(files => new Set(files));
    const thumbnails = new Set();
    for (const file of files) {
      const match = file.match(/^(\d+)\.jpg$/);
      if (match) {
        thumbnails.add(Number(match[1]));
      }
    }
    return `
SELECT
  record_id,
  title,
  record_type
FROM
  _unified_records
WHERE
  has_digital=TRUE
  AND record_type IN ('Video', 'Document', 'Image')
  AND record_id NOT IN (${([...thumbnails].join(","), -1)})
ORDER BY
  record_id
      `;
  },
  'featured_no_digital': `
        SELECT
          record_id,
          title,
          collection
        FROM _unified_records
        WHERE
          has_digital=FALSE
          AND (record_id IN (SELECT record_id FROM featured_records))
        ORDER BY record_id
      `,
};
// WHERE url IS NOT NULL AND url != '' AND url!~ '/^https\\?://([a-zA-Z0-9](\\?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])\\?\\.)+[a-zA-Z]{2,}\\//'




class DataCleanupService extends KnexService {
  constructor(options) {
    super({
      ...options,
      name: "data_cleanup",
    });
  }

}

const find = async function (context) {
  const { query = {} } = context.params;
  const { type, $limit = 100, $skip = 0 } = query;

  if (!type) {
    throw new Error("Query type is required");
  }

  // Define your cleanup queries here
  // Each type corresponds to a specific SQL query


  const typeQuery = queries[type];
  if (!typeQuery) {
    throw new Error(`Unknown query type: ${type}`);
  }
  const querySQL = typeof typeQuery === 'function' ? await typeQuery(context) : typeQuery;

  const knex = this.options.Model;

  // Get total count
  const countQuery = `SELECT COUNT(*) as total FROM (${querySQL}) as subquery`;
  const [{ total }] = await knex.raw(countQuery).then(result => result.rows);

  // Get paginated data
  const dataQuery = `${querySQL} LIMIT ${$limit} OFFSET ${$skip}`;
  const { rows: data } = await knex.raw(dataQuery);
  context.result = {
    total: parseInt(total),
    limit: $limit,
    skip: $skip,
    data,
  };
  return context;
};


export default function (app) {
  const options = {
    Model: app.get("postgresqlClient"),
    paginate: {
      default: 100,
      max: 500,
    },
  };

  // Initialize service with only 'find' method
  app.use("/api/data_cleanup", new DataCleanupService(options), {
    methods: ["find"],
  });

  const service = app.service("api/data_cleanup");

  // Add any hooks here if needed
  service.hooks({
    before: {
      find: [find],
    },
    after: {
      find: [],
    },
  });
}