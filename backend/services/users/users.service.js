import hooks from "./users.hooks.js";

import { KnexServiceExtended as KnexService } from "#backend/postgresql.js";

class Users extends KnexService {
  constructor(options) {
    super({
      ...options,
      name: "users",
    });
  }
}
export default (function (app) {
  const options = {
    id: "user_id",
    Model: app.get("postgresqlClient"),
    paginate: app.get("paginate"),
  };
  // Initialize our service with any options it requires
  app.use("/api/users", new Users(options), {
    methods: ["find", "get", "create", "patch"],
  });
  // Get our initialized service so that we can register hooks
  const service = app.service("api/users");
  service.hooks(hooks);
});
