import { KnexService } from "@feathersjs/knex";

class VersionHistory extends KnexService {
  constructor(options) {
    super({
      ...options,
      name: "version_history",
    });
  }
}
export default (function (app) {
  const options = {
    id: "version_id",
    Model: app.get("postgresqlClient"),
    paginate: { ...app.get("paginate"), max: false },
  };
  // Initialize our service with any options it requires
  app.use("/api/version_history", new VersionHistory(options), { methods: ["get", "find", "create"] });
  const service = app.service("api/version_history");

  service.hooks({
    // around: {
    //     all: [setArchiveData],
    // },
    before: {
      all: [],
      get: [],
      create: [],
    },
    after: {},
  });
});
