import { KnexServiceExtended as KnexService } from "#backend/postgresql.js";

class Media extends KnexService {
  constructor(options) {
    super({
      ...options,
      name: "media",
    });
  }
}
export default (function (app) {
  const options = {
    id: "media_id",
    Model: app.get("postgresqlClient"),
    paginate: app.get("paginate"),
    multi: true,
  };
  // Initialize our service with any options it requires
  app.use("/api/media", new Media(options));
  // Get our initialized service so that we can register hooks
  const service = app.service("api/media");
  const updateView = async (context) => {
    const {
      id,
      app,
      data,
      result,
      params: {
        user,
        transaction: { trx },
      },
    } = context;

    const recordIds = id ? [result].flat().map((r) => r.record_id) : [data?.record_id];

    await Promise.all(
      recordIds
        .filter(Boolean)
        .map((recordId) => app.service("api/records").patch(recordId, {}, { user, transaction: { trx } })),
    );
  };

  const cleanupMeta = (context) => {
    const { data } = context;
    ["format", "quality", "generation"].forEach((key) => {
      if (data[`${key}_item`] !== undefined) {
        data[`${key}_id`] = data[`${key}_item`]?.list_item_id;
        delete data[`${key}_item`];
      }
    });

    if ("call_number_item" in data) {
      data.call_number_id = data.call_number_item?.list_item_id;
      delete data.call_number_item;
    }

    [
      "contributor_name",
      "contributor_username",
      "creator_name",
      "creator_username",
      "is_primary",
      "delete",
      "call_number",
    ].forEach((key) => delete data[key]);
    return context;
  };

  service.hooks({
    before: {
      all: [],
      create: [cleanupMeta],
      patch: [cleanupMeta],
    },
    after: {
      create: [updateView],
      patch: [updateView],
      remove: [updateView],
    },
    error: {
      patch: [],
    },
  });
});
