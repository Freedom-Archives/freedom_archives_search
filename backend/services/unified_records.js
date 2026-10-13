import { rankedSearch } from "./common_hooks/index.js";

import { KnexServiceExtended as KnexService } from "#backend/postgresql.js";

class UnifiedRecords extends KnexService {
  constructor(options) {
    super({
      ...options,
      name: "_unified_records",
      operators: ["$fullText", "$contains"],
      extendedOperators: {
        $overlap: "&&",
        $contains: "@>",
        $contained_by: "<@",
        $fulltext: "@@",
      },
    });
  }
}
export default (function (app) {
  const options = {
    id: "record_id",
    Model: app.get("postgresqlClient"),
    paginate: app.get("paginate"),
  };
  // Initialize our service with any options it requires
  app.use("api/unified_records", new UnifiedRecords(options));

  const service = app.service("api/unified_records");
  service.hooks({
    before: {
      all: [],
      find: [rankedSearch],
    },
  });
});
