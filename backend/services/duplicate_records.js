import { rankedSearch } from "./common_hooks/rankedSearch.js";

import { KnexServiceExtended as KnexService } from "#backend/postgresql.js";

class DuplicateRecords extends KnexService {
  constructor(options) {
    super({
      ...options,
      name: "duplicate_records",
    });
  }
}

const getRecordIds = (context) => {
  const { id } = context;
  const [record_id_1, record_id_2] = id.split("%7C");
  if (!record_id_1 || !record_id_2) {
    throw new Error("invalid duplicate record id");
  }
  return [record_id_1, record_id_2];
};

export default (function (app) {
  const options = {
    id: "duplicate_record_id",
    Model: app.get("postgresqlClient"),
    paginate: { ...app.get("paginate"), max: false },
    multi: true,
    operators: ["$fullText", "$contains"],
  };
  // Initialize our service with any options it requires
  app.use("/api/duplicate_records", new DuplicateRecords(options), {
    methods: ["find", "patch", "remove"],
  });
  // Get our initialized service so that we can register hooks
  const service = app.service("api/duplicate_records");

  const ignoreDuplicateRecord = async (context) => {
    const { id } = context;
    const [record_id_1, record_id_2] = getRecordIds(context);

    const knex = context.app.get("postgresqlClient");
    await knex.table("duplicate_records_ignore").insert({ record_id_1, record_id_2 });

    context.result = {
      id,
    };
    return context;
  };

  const mergeDuplicateRecords = async (context) => {
    const {
      data,
      params: { transaction: tx },
    } = context;
    const [record_id_1, record_id_2] = getRecordIds(context);
    // console.log('Merging duplicate records:', record_id_1, record_id_2, data);
    const trx = tx?.trx;
    if (!trx) {
      throw new Error("Missing transaction for duplicate record merge");
    }

    const res = await context.app.service("/api/records").patch(record_id_1, data, { transaction: tx });

    // Update related_records to point at the surviving record, and normalize ordering
    // so record_id_1 is always <= record_id_2.
    await trx.raw(
      `
      WITH params AS (
        SELECT :old_id::bigint AS old_id, :new_id::bigint AS new_id
      )
      UPDATE related_records r
      SET
        record_id_1 = LEAST(
          CASE WHEN r.record_id_1 = params.old_id THEN params.new_id ELSE r.record_id_1 END,
          CASE WHEN r.record_id_2 = params.old_id THEN params.new_id ELSE r.record_id_2 END
        ),
        record_id_2 = GREATEST(
          CASE WHEN r.record_id_1 = params.old_id THEN params.new_id ELSE r.record_id_1 END,
          CASE WHEN r.record_id_2 = params.old_id THEN params.new_id ELSE r.record_id_2 END
        )
      FROM params
      WHERE r.record_id_1 = params.old_id OR r.record_id_2 = params.old_id;
      `,
      { old_id: record_id_2, new_id: record_id_1 },
    );
    await trx("related_records").whereRaw("record_id_1 = record_id_2").delete();

    await context.app.service("/api/records").remove(record_id_2, { transaction: tx });
    context.result = {
      ...res,
    };
    return context;
  };

  service.hooks({
    before: {
      find: [rankedSearch],
      patch: [mergeDuplicateRecords],
      remove: [ignoreDuplicateRecord],
    },
    after: {},
    error: {},
  });
});
