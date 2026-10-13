import { KnexServiceExtended as KnexService } from "#backend/postgresql.js";

class ReviewChanges extends KnexService {
  constructor(options) {
    super({
      ...options,
      name: "review_changes",
    });
    // this.find = this.find.bind(this);
  }
}
export default (function (app) {
  const options = {
    id: "id",
    Model: app.get("postgresqlClient"),
    paginate: app.get("paginate"),
  };
  // Initialize our service with any options it requires
  app.use("/api/review_changes", new ReviewChanges(options));
});
