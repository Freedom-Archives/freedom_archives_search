import { KnexServiceExtended as KnexService } from "#backend/postgresql.js";

class ListItemsLookup extends KnexService {
  constructor(options) {
    super({
      ...options,
      name: "list_items_lookup",
    });
    // this.find = this.find.bind(this);
  }
}
export default (function (app) {
  const options = {
    id: "list_item_id",
    Model: app.get("postgresqlClient"),
    paginate: app.get("paginate"),
  };
  // Initialize our service with any options it requires
  app.use("/api/list_items_lookup", new ListItemsLookup(options));
});
