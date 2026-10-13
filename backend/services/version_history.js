import { KnexServiceExtended as KnexService } from "#backend/postgresql.js";

class VersionHistory extends KnexService {
  constructor(options) {
    super({
      ...options,
      name: "version_history_view",
    });
  }
}
export default (function (app) {
  const options = {
    id: "version_id",
    Model: app.get("postgresqlClient"),
  };

  app.use("/api/version_history", new VersionHistory(options), { methods: ["get", "find"] });
  const service = app.service("api/version_history");

  service.hooks({
    before: {
      all: [],
      get: [],
    },
    after: {},
  });
});
