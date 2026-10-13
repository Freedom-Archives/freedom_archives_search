import { KnexServiceExtended as KnexService } from "#backend/postgresql.js";
// import schema from "@feathersjs/schema";

// const { hooks: schemaHooks, resolve, virtual } = schema;
// const settingsResultResolver = resolve({
//   featured_collection: virtual(async (res, context) => {
//     console.log("res", res);
//     if (res?.setting === 'frontPageCollectionNum') {
//       return await context.app
//         .service("api/public/collections")
//         .get(res?.value, { query: { $select: ["collection_name", "thumbnail", "description"] } });
//     }
//     return {};
//   }),
// });
class PublicSettings extends KnexService {
  constructor(options) {
    super({
      ...options,
      name: "public_search.config",
    });
  }
}
export default (function (app) {
  const options = {
    id: "archive_id",
    Model: app.get("postgresqlClient"),
  };
  // Initialize our service with any options it requires
  app.use("/api/public/settings", new PublicSettings(options), { methods: ["find"] });
  const service = app.service("api/public/settings");

  service.hooks({
    around: {
      // all: [schemaHooks.resolveResult(settingsResultResolver)],
    },
    before: {
      all: [],
      get: [],
    },
    after: {},
  });
});
