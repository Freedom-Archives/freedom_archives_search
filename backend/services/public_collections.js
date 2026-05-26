import { KnexService } from "@feathersjs/knex";

import { rankedSearch } from "./common_hooks/rankedSearch.js";

class PublicCollections extends KnexService {
  constructor(options) {
    super({
      ...options,
      name: "public_search.collections",
      extendedOperators: {
        $fulltext: "@@",
      },
    });
  }
}
export default (function (app) {
  const options = {
    id: "collection_id",
    Model: app.get("postgresqlClient"),
  };
  // Initialize our service with any options it requires
  app.use("/api/public/collections", new PublicCollections(options), { methods: ["get", "find"] });
  const service = app.service("api/public/collections");

  service.hooks({
    around: {
      all: [],
    },
    before: {
      find: [rankedSearch],
      all: [],
      get: [],
    },
    after: {},
  });
});
