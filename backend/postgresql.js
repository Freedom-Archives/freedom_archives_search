import { KnexService } from "@feathersjs/knex";
import knex from "knex";

export default (function (app) {
  const config = app.get("postgresql");
  const db = knex({
    ...config,
    extendedOperators: {
      $overlap: "&&",
      $contains: "@>",
      $contained_by: "<@",
      $fulltext: "@@",
    },
    debug: false,
  });
  app.set("postgresqlClient", db);
});
export class KnexServiceExtended extends KnexService {
  createQuery(params = {}) {
    const { $sort, ...query } = params.query || {};
    const builder = super.createQuery({ ...params, query });
    if ($sort) {
      for (const [key, dir] of Object.entries($sort)) {
        builder.orderBy(key, Number(dir) === 1 ? "asc" : "desc", "last");
      }
    }

    return builder;
  }
}
