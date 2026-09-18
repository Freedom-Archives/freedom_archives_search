import { describe, it, expect, afterAll } from "vitest";

import app from "../../backend/app.js";

const params = {
  user: { archive_id: 1, role: "administrator" },
};

describe("'records' service", () => {
  afterAll(async () => {
    await app.get("postgresqlClient").raw('delete from "records" where title like ?', ["__vitest_records_%"]);
  });

  it("registered the service", () => {
    const service = app.service("api/records");

    expect(service).toBeDefined();
  });

  it("allows setting duplicate list items on a record", async () => {
    const uniq = `__vitest_records_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const recordTitle = `${uniq}_record`;
    const service = app.service("api/records");
    const keyword = { item: "Attica", list_item_id: 3569 };
    const record = {
      title: recordTitle,
      collection_id: 1000,
      keywords: [keyword, keyword],
    };
    const result = await service.create(record, params);
    expect(result.keywords).toEqual([keyword]);
  });
});
