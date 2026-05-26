import { KnexService } from "@feathersjs/knex";
import { cloneDeep } from "lodash-es";

import { sanitizeParams } from "../utils/index.js";

import { rankedSearch } from "./common_hooks/index.js";

const archive_id = 1;
class PublicRecords extends KnexService {
  constructor(options) {
    super({
      ...options,
      name: "public_search.records_view",
      extendedOperators: {
        $overlap: "&&",
        $contains: "@>",
        $contained_by: "<@",
        $fulltext: "@@",
      },
    });
  }
}
// const fullTextSearch = (context) => {
//   context.params.query.archive_id = archive_id;
//   if (context.params.query.fulltext !== undefined) {
//     const {
//       fulltext: { $fulltext },
//       ...query
//     } = context.params.query;
//     const knex = context.service.createQuery({ ...context.params, query });
//     if ($fulltext) {
//       const fullTextQuery = tsquery($fulltext);
//       knex
//         .clearOrder()
//         .select(context.service.Model.raw(`ts_rank_cd(fulltext, to_tsquery('english', ?)) AS score`, [fullTextQuery]))
//         .whereRaw(`fulltext @@ to_tsquery('english', ?)`, [fullTextQuery])
//         .orderBy([{ column: "score", order: "desc" }, { column: "title" }]);
//       // knex.orderBy("title");
//       // knex.orderBy([{ column: "score", order: "desc" }]);
//       // knex.orderBy("score", "desc");
//     }
//     context.params.knex = knex;
//   }
// };

const lookupFilters = async (context) => {
  const { service: { Model } } = context;
  const params = await sanitizeParams(context);
  if (!params.provider) {
    return;
  }
  // console.time("filters");
  const baseQuery = params.knex || context.service.createQuery(params);
  const recordsQuery = baseQuery.clone().clearSelect().clearOrder().from("public_search.records").select("record_id");
  // const aggregatedDataQuery = baseQuery.clone().clearSelect().clearOrder().select().unionAll([
  const aggregatedDataQuery = context.service
    .getModel()
    .unionAll(
      [
        Model.select(Model.raw("li.type::text || '_ids' AS type, li.item::text AS item, li.list_item_id"))
          .count()
          .from("public_search.records_to_list_items AS r")
          .join("public_search.list_items AS li", "r.list_item_id", "li.list_item_id")
          .joinRaw("INNER JOIN filtered_records f ON r.record_id = f.record_id")
          .whereIn("li.type", ["keyword", "subject", "author"])
          .groupBy("li.type", "li.item", "li.list_item_id"),
        Model.select(Model.raw("'year' AS type, year::text AS item, 0 as list_item_id"))
          .count()
          .from("public_search.records_view AS r")
          .joinRaw("INNER JOIN filtered_records f ON r.record_id = f.record_id")
          .whereNotNull("year")
          .groupBy("year"),
        Model.select(Model.raw("'title' AS type, title::text, 0"))
          .count()
          .from("public_search.records_view AS r")
          .joinRaw("INNER JOIN filtered_records f ON r.record_id = f.record_id")
          .groupBy("title")
          .havingRaw("COUNT(*) > 1"),
        Model.select(Model.raw("'collection_id' AS type, collection_title::text, collection_id"))
          .count()
          .from("public_search.records_view AS r")
          .joinRaw("INNER JOIN filtered_records f ON r.record_id = f.record_id")
          .groupBy("collection_id", "collection_title"),
        Model.select(Model.raw("'record_type' AS type, record_type::text, 0"))
          .count()
          .from("public_search.records_view AS r")
          .joinRaw("INNER JOIN filtered_records f ON r.record_id = f.record_id")
          .whereNot("record_type", "")
          .groupBy("record_type"),
        Model.select(Model.raw("'format' AS type, format::text, 0"))
          .count()
          .from("public_search.records_view AS r")
          .joinRaw("INNER JOIN filtered_records f ON r.record_id = f.record_id")
          .whereNot("format", "")
          .groupBy("format"),
      ],
      true,
    );

  const query = Model.with("filtered_records", recordsQuery)
    .with("aggregated_data", aggregatedDataQuery)
    .select(
      Model.raw(`
      type AS type, 
      jsonb_agg(jsonb_build_array(item, count, list_item_id) ORDER BY count DESC) AS values
    `),
    )
    .from("aggregated_data")
    .groupBy("type");

  const filters = await query;
  // console.timeEnd("filters");
  return filters.reduce((acc, { type, values }) => {
    acc[type] = values;
    return acc;
  }, {});
};

const getNonDigitizedTotal = async (context) => {
  const { provider, query: { has_digital } } = context.params;
  const noFilterContext = cloneDeep(context);
  noFilterContext.params.query.has_digital = false;

  if (provider && has_digital) {
    const updatedContext = await rankedSearch(noFilterContext);
    // console.time("nonDigitized");

    const res = await updatedContext.params.knex
      .clone()
      .clear('select')
      .clear('order')
      .clear('limit')
      .where('has_digital', false)
      .count("record_id")
      .first();

    // console.timeEnd("nonDigitized");

    return res.count;
  }
};

const searchCollectionTitles = async (context) => {
  const {
    params: {
      _rankedSearch: searchTerm,
      query: { ancestor_collection_ids },
    },
  } = context;

  // Don't run collection title search if we are on a collection page
  const ancestorIds = ancestor_collection_ids?.$contains || [];
  if (!searchTerm || ancestorIds.length > 0) {
    return [];
  }

  return await context.app.service("api/public/collections").find({
    query: {
      $fullText: searchTerm,
      $select: ["collection_id", "title"],
    },
  });
};

const searchRecords = async (context) => {
  context.params.query.archive_id = archive_id;
  const params = await sanitizeParams(context);

  const [data, filters, nonDigitizedTotal, collections] = await Promise.all([
    context.service._find(params),
    lookupFilters(context),
    getNonDigitizedTotal(context),
    searchCollectionTitles(context),
  ]);
  //   .map(async (p, index) => {
  //   // console.time(`promise${index}`);
  //   const res = await p;
  //   // console.timeEnd(`promise${index}`);;
  //   return res;
  // }));
  context.result = {
    ...data,
    filters,
    nonDigitizedTotal,
    collections,
  };
  return context;
};

const hooks = {
  before: {
    find: [rankedSearch, searchRecords],
  },
};

export default (function (app) {
  const options = {
    id: "record_id",
    Model: app.get("postgresqlClient"),
    paginate: app.get("paginate"),
    authentication: false,
  };
  // Initialize our service with any options it requires
  app.use("/api/public/records", new PublicRecords(options), {
    methods: ["find"],
  });
  const service = app.service("api/public/records");
  service.hooks(hooks);
});
