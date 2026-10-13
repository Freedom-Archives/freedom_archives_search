// @ts-nocheck
import { BadRequest, MethodNotAllowed } from "@feathersjs/errors";

import { KnexServiceExtended as KnexService } from "#backend/postgresql.js";

// In-memory store for refresh status per type.
// NOTE: This is per-process and resets on restart.
const refreshingStatus = {};
const STATEMENT_TIMEOUT_MS = 300_000; // 5 minutes

const getRefreshStatusForType = (type) => {
  const key = String(type || "");
  return (
    refreshingStatus[key] || {
      type: key,
      refreshing: false,
      startedAt: null,
      finishedAt: null,
      ok: null,
      error: null,
    }
  );
};

class DuplicateListItemsRefreshStatusService {
  async find(params = {}) {
    const type = params.query?.type;
    if (type) {
      const status = getRefreshStatusForType(type);
      return { data: [status], total: 1, limit: 1, skip: 0 };
    }

    const data = Object.values(refreshingStatus);
    return { data, total: data.length, limit: data.length, skip: 0 };
  }

  async get(id) {
    return getRefreshStatusForType(id);
  }
}

const duplicatesSelectSql = (targeted) => {
  const baseSql = `
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
      (dli.list_item_id_1 IS NOT NULL) AS is_ignored
    FROM freedom_archives.list_items a
    JOIN freedom_archives.list_items b
      ON  b.archive_id   = a.archive_id
      AND b.type         = a.type
      AND b.list_item_id > a.list_item_id
      AND a.search_text % b.search_text
    JOIN freedom_archives.list_items_lookup c
      ON c.list_item_id = a.list_item_id
    JOIN freedom_archives.list_items_lookup d
      ON d.list_item_id = b.list_item_id
    LEFT JOIN freedom_archives.duplicate_list_items_ignore dli
      ON dli.list_item_id_1 = a.list_item_id
     AND dli.list_item_id_2 = b.list_item_id
    CROSS JOIN LATERAL (
      SELECT similarity(a.search_text, b.search_text) AS sim
    ) s
  `;

  // Full refresh: caller can append WHERE a.type = ? / ORDER BY etc.
  if (!targeted) {
    return baseSql;
  }

  // Targeted: same query twice, no OR.
  return `
      SELECT * FROM (
        ${baseSql}
        WHERE a.list_item_id = ? AND a.archive_id = ? AND a.type = ?

        UNION ALL

        ${baseSql}
        WHERE b.list_item_id = ? AND b.archive_id = ? AND b.type = ?
      ) q
      ORDER BY q.sim DESC
    `;
};

class ValueLookup extends KnexService {
  constructor(options) {
    super({
      ...options,
      name: "duplicate_list_items",
    });
    // this.find = this.find.bind(this);
  }

  setup(app) {
    this.app = app;
    // KnexService in this codebase doesn't require calling a super.setup.
  }

  _parseDuplicateId(duplicate_list_item_id) {
    const raw = String(duplicate_list_item_id || "");
    let decoded = raw;
    try {
      decoded = decodeURIComponent(raw);
    } catch {
      // If it isn't valid URI encoding, just parse as-is.
    }

    const [aRaw, bRaw] = decoded.split("|");
    const a = Number(aRaw);
    const b = Number(bRaw);
    if (!Number.isInteger(a) || !Number.isInteger(b)) {
      throw new BadRequest("Invalid duplicate_list_item_id; expected 'id1|id2'");
    }
    if (a === b) {
      throw new BadRequest("Invalid duplicate_list_item_id; ids must differ");
    }
    return [a, b];
  }

  async _normalizePair(list_item_id_1, list_item_id_2) {
    const a = Number(list_item_id_1);
    const b = Number(list_item_id_2);
    if (!Number.isInteger(a) || !Number.isInteger(b)) {
      throw new BadRequest("list_item_id_1 and list_item_id_2 must be integers");
    }
    if (a === b) {
      throw new BadRequest("Cannot ignore a duplicate pair with identical ids");
    }
    return a < b ? [a, b] : [b, a];
  }
}

const refresh = async (context) => {
  const { app } = context;
  const type = context.data?.type || context.result?.type;

  if (!type || typeof type !== "string") {
    throw new BadRequest("Missing or invalid 'type' field in data for refresh");
  }

  const existingStatus = getRefreshStatusForType(type);
  if (existingStatus.refreshing) {
    context.result = { ok: true, refresh: { ok: false, reason: "already_refreshing", status: existingStatus } };
    return context;
  }

  const startedAt = new Date().toISOString();
  refreshingStatus[type] = {
    type,
    refreshing: true,
    startedAt,
    finishedAt: null,
    ok: null,
    error: null,
  };


  setImmediate(async () => {
    const knex = app.get("postgresqlClient");
    try {
      await knex.transaction(async (trx) => {
        await trx.raw(`SET LOCAL statement_timeout TO ${STATEMENT_TIMEOUT_MS};`);
        await trx("duplicate_list_items").where({ type }).delete();
        await trx.raw("SELECT pg_advisory_xact_lock(hashtext(?))", [`duplicate_list_items_refresh:${type}`]);
        await trx.raw(
          `
          INSERT INTO freedom_archives.duplicate_list_items
          ${duplicatesSelectSql()}
          WHERE a.type = ?
          ORDER BY s.sim DESC
          `,
          [type],
        );
      });

      refreshingStatus[type] = {
        ...getRefreshStatusForType(type),
        refreshing: false,
        finishedAt: new Date().toISOString(),
        ok: true,
        error: null,
      };
    } catch (err) {
      console.error("Error refreshing duplicate_list_items:", err);

      refreshingStatus[type] = {
        ...getRefreshStatusForType(type),
        refreshing: false,
        finishedAt: new Date().toISOString(),
        ok: false,
        error: String(err?.message || err),
      };
    }
  });

  context.result = {
    ok: true,
    refresh: {
      ok: true,
      refreshed: "table_from_query",
      type,
      status: getRefreshStatusForType(type),
    },
  };
  return context;
};

const ignorePair = async (context) => {
  const { id, params } = context;
  const restore = params.query?.restore === "true";
  const {
    params: {
      transaction: { trx },
    },
  } = context;
  if (id == null) {
    throw new MethodNotAllowed("Bulk ignore is not supported");
  }

  const [raw1, raw2] = context.service._parseDuplicateId(id);
  const [id1, id2] = await context.service._normalizePair(raw1, raw2);
  await trx.raw(`SET LOCAL statement_timeout TO ${STATEMENT_TIMEOUT_MS};`);

  const duplicateId = `${id1}|${id2}`;
  if (restore) {
    await trx("duplicate_list_items_ignore")
      .where({ list_item_id_1: id1, list_item_id_2: id2 })
      .orWhere({ list_item_id_1: id2, list_item_id_2: id1 })
      .delete();
  } else {
    await trx("duplicate_list_items_ignore")
      .insert({ list_item_id_1: id1, list_item_id_2: id2 })
      .onConflict(["list_item_id_1", "list_item_id_2"])
      .ignore();
  }

  await trx("duplicate_list_items").where({ duplicate_list_item_id: duplicateId }).update({ is_ignored: !restore });

  context.result = { ok: true, ignored: { list_item_id_1: id1, list_item_id_2: id2 } };
  return context;
};

const mergePair = async (context) => {
  const { id, data, params } = context;
  const {
    transaction: { trx },
    user: { archive_id },
  } = params;
  if (id == null) {
    throw new MethodNotAllowed("Bulk merge is not supported");
  }

  let source_id;
  let target_id;
  if (data?.source_id && data?.target_id) {
    source_id = data.source_id;
    target_id = data.target_id;
  } else {
    throw new BadRequest("Missing merge direction (direction: '1_to_2' | '2_to_1')");
  }

  const listItems = context.app.service("api/list_items");
  const source = await listItems.get(source_id, params);
  const type = source?.type;

  await trx.raw(`SET LOCAL statement_timeout TO ${STATEMENT_TIMEOUT_MS};`);

  await listItems.update(source_id, { merge_target_id: target_id }, params);

  await trx("duplicate_list_items")
    .where({ type, archive_id: source.archive_id })
    .andWhere((qb) => {
      qb.whereIn("list_item_id_1", [source_id, target_id]).orWhereIn("list_item_id_2", [source_id, target_id]);
    })
    .delete();

  await trx.raw(` INSERT INTO freedom_archives.duplicate_list_items ${duplicatesSelectSql(true)} `, [
    target_id,
    archive_id,
    type,
    target_id,
    archive_id,
    type,
  ]);

  context.result = { ok: true, merged: { source_id, target_id }, type };
  return context;
};

export default (function (app) {
  const options = {
    id: "duplicate_list_item_id",
    Model: app.get("postgresqlClient"),
    paginate: app.get("paginate"),
  };
  // Initialize our service with any options it requires
  app.use("/api/duplicate_list_items", new ValueLookup(options), {
    methods: ["find", "update", "remove", "patch"],
  });

  // Polling endpoint (in-memory, per-process) for UI.
  // Example: GET /api/duplicate_list_items_refresh_status?type=keyword
  app.use("/api/duplicate_list_items_refresh_status", new DuplicateListItemsRefreshStatusService(), {
    methods: ["find", "get"],
  });

  const service = app.service("api/duplicate_list_items");

  service.hooks({
    before: {
      update: [refresh],
      remove: [ignorePair],
      patch: [mergePair],
    },
  });
});
