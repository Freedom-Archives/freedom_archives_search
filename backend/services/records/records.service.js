import hooks from "./records.hooks.js";

import { KnexServiceExtended as KnexService } from "#backend/postgresql.js";

class Records extends KnexService {}
const getOptions = (app) => ({
  Model: app.get("postgresqlClient"),
  paginate: app.get("paginate"),
  name: "records",
  id: "record_id",
  multi: true,
  operators: ["$fullText", "$contains"],
  methods: ["find", "get", "create", "patch", "remove"],
});
export default (function (app) {
  // Initialize our service with any options it requires
  app.use("/api/records", new Records(getOptions(app)));
  // Get our initialized service so that we can register hooks
  const service = app.service("api/records");
  service.hooks(hooks);
});
