import schema from "@feathersjs/schema";

import allowAnonymous from "./allowAnonymous.js";
import authRoles from "./authRoles.js";
import { rankedSearch } from "./rankedSearch.js";
import { updateThumbnail } from "./thumbnailer.js";

const { hooks: schemaHooks, resolve } = schema;
const archiveResolver = resolve({
  archive_id: (_value, _query, context) => {
    if (context.params.user) {
      return context.params.user.archive_id;
    }
  },
});
export const setArchiveQuery = schemaHooks.resolveQuery(archiveResolver);
export const setArchiveData = schemaHooks.resolveData(archiveResolver);
export const setUser = (context) => {
  const {
    data = {},
    method,
    service: { Model },
    params: { user },
  } = context;
  if (!user) return context;
  const { user_id } = user;
  if (method === "create") {
    data.creator_user_id = user_id;
    data.date_created = Model.raw("now()");
  } else {
    data.contributor_user_id = user_id;
    data.date_modified = Model.raw("now()");
  }
  return context;
};
export const setArchive = (context) => {
  const {
    data,
    method,
    service,
    params: { user: { archive_id } = {} },
  } = context;
  if (method === "create" && service !== "api/authenticate") {
    data.archive_id = archive_id;
  }
  return context;
};
export const fetchUnified = async (context) => {
  const {
    id,
    app,
    method,
    params,
    service: { fullName },
  } = context;
  const service = `api/unified_${fullName}`;
  // context.params.knex = context.app.service(`unified_${path}`).createQuery(context.params);
  if (method === "get") {
    context.result = await app.service(service).get(id, params);
  } else {
    context.result = await app.service(service).find(params);
  }
  return context;
};
export const prepListItemRelations = (context) => {
  const { data, relation_data = {} } = context;
  if (data && Object.keys(data).length) {
    ["subjects", "keywords", "producers", "authors", "publishers"].forEach((key) => {
      if (data[key]) {
        relation_data[key] = data[key];
        delete data[key];
      }
    });
    if ("collection" in data) {
      data.collection_id = data.collection ? data.collection.collection_id : null;
      delete data.collection;
    }
  }
  return context;
};
export const updateListItemRelations = async (context) => {
  const {
    data,
    relation_data,
    params: {
      transaction: { trx },
    },
    service: { fullName },
  } = context;
  const table = fullName.slice(0, -1);
  const id = parseInt(context.id || context.result[`${table}_id`], 10);
  for (const type of ["subjects", "keywords", "producers", "authors", "publishers"]) {
    if (relation_data && relation_data[type] !== undefined) {
      const join_table = `${table}s_to_list_items`;
      await trx
        .from(join_table)
        .join("list_items", `${join_table}.list_item_id`, "list_items.list_item_id")
        .where("type", type.replace(/s$/, ""))
        .andWhere(`${table}_id`, id)
        .delete();
      // .select(`${join_table}.list_item_id`)
      // console.log(ids);
      // const res = await trx(`${join_table}`).whereIn("list_item_id", ids).delete();
      if (relation_data[type].length) {
        await trx(join_table)
          .insert(
            relation_data[type].map(({ list_item_id }) => ({
              list_item_id,
              [`${table}_id`]: id,
            })),
          )
          .onConflict(["list_item_id", `${table}_id`])
          .ignore();
      }
    }
  }
  if (!Object.keys(data).length) {
    context.result = await trx(`${table}s`).where(`${table}_id`, id).select();
  }
  // console.log("UPDATE DONE", context.result);
  return context;
};
export const refreshView = async (context) => {
  const {
    result,
    method,
    params: {
      transaction: { trx },
    },
    service: { fullName },
    app,
  } = context;
  const table = fullName.slice(0, -1);
  const id = context.id || result[`${table}_id`];
  const additional_views = context.additional_views || [];
  await Promise.all(
    additional_views.map(async ([table, id]) => {
      await app.service(`api/${table}`).patch(id, {}, { transaction: { trx } });
    }),
  );

  const unifiedTable = `_unified_${table}s`;
  const columns = await trx(unifiedTable).columnInfo();
  const pk = `${table}_id`;

  if (["remove"].includes(method)) {
    await trx(unifiedTable).where(pk, id).delete();
    return context;
  }

  if (["update", "patch", "create"].includes(method)) {
    // Concurrency-safe refresh: INSERT from the unified view with an UPSERT.
    // NOTE: The onConflict/merge must be chained on the INSERT builder, not the SELECT subquery.
    const selectRow = trx.select("*").from(`unified_${table}s`).where(pk, id);
    const res = await trx(unifiedTable).insert(selectRow).onConflict(pk).merge(Object.keys(columns)).returning("*");
    context.result = res?.[0] || {};
    return context;
  }
};

export const validateArchive = (context) => {
  const {
    params: {
      user: { archive_id } = {},
      query: { archive_id: query_archive_id } = {},
      data: { archive_id: data_archive_id } = {},
    },
  } = context;
  if (!archive_id) {
    return;
  }
  [query_archive_id, data_archive_id].forEach((input) => {
    if (input && input !== archive_id) {
      throw new Error("Archive mismatch");
    }
  });
};

export const logHook = (context) => {
  // eslint-disable-next-line no-console
  console.log(`HOOK: ${context.path} ${context.method} ${context.type} ${context.id ? `ID:${context.id}` : ""}`);
};

export const debugQuery = (context) => {
  const debug = context.app.get("postgresqlClient")?.client?.config?.debug;
  if (debug && context?.result?.data && context?.params?.knex) {
    context.result.query = context.params.knex.toString();
  }
  return context;
};

export const allowDisablePagination = (context) => {
  const { method, params } = context;
  if (["find", "get"].includes(method) && params.query?.$disable_pagination) {
    context.params.paginate = false;
    delete params.query.$disable_pagination;
  }
  return context;
};

export { allowAnonymous, authRoles, rankedSearch, updateThumbnail };
