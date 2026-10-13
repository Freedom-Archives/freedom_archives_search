import { rankedSearch } from "../common_hooks/rankedSearch.js";

import { KnexServiceExtended as KnexService } from "#backend/postgresql.js";

class UnifiedSearch extends KnexService {
  constructor(options) {
    super({
      ...options,
      name: "unified_search_view", // Virtual unified view
      id: "id",
      operators: ["$fullText"],
    });
  }
}

const getOptions = (app) => ({
  Model: app.get("postgresqlClient"),
  paginate: app.get("paginate"),
  name: "unified_search_view",
  id: "id",
  methods: ["find"],
});

export default function (app) {
  app.use("/api/unified_search", new UnifiedSearch(getOptions(app)));
  const service = app.service("api/unified_search");
  const hooks = {
    before: {
      find: [rankedSearch],
    },
  };

  service.hooks(hooks);
}
