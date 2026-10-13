import { KnexServiceExtended as KnexService } from "#backend/postgresql.js";
import sinon from "sinon";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import app from "../backend/app.js";
import logger from "../backend/logger.js";

class TxTestService extends KnexService {}

describe("global transaction hooks (app.hooks.js)", () => {
  const knex = app.get("postgresqlClient");
  const uniq = `__vitest_tx_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  const tableName = `${uniq}_table`;
  const servicePath = `api/${uniq}`;

  /** @type {import('@feathersjs/feathers').Service<any>} */
  let service;

  beforeAll(async () => {
    // Keep expected error-path tests quiet.
    sinon.stub(logger, "error");

    // Ensure archive exists since app-level create hook always sets archive_id
    await knex.raw(
      'insert into "archives" ("archive_id", "title") values (?, ?) on conflict ("archive_id") do nothing',
      [1, "Test Archive"],
    );

    await knex.schema.dropTableIfExists(tableName);
    await knex.schema.createTable(tableName, (t) => {
      t.increments("id").primary();
      t.integer("archive_id").notNullable();
      t.text("note").notNullable();
    });

    app.use(
      `/${servicePath}`,
      new TxTestService({
        Model: knex,
        name: tableName,
        id: "id",
        paginate: false,
      }),
    );

    service = app.service(servicePath);
  });

  afterAll(async () => {
    if (logger.error.restore) logger.error.restore();
    await knex.schema.dropTableIfExists(tableName);
  });

  it("starts a transaction before create (service hook sees params.transaction.trx)", async () => {
    let sawTrx = false;

    service.hooks({
      before: {
        create: [
          async (context) => {
            sawTrx = Boolean(context.params?.transaction?.trx);
            return context;
          },
        ],
      },
    });

    await service.create(
      { note: `${uniq}_saw_trx` },
      {
        user: { archive_id: 1, role: "administrator" },
      },
    );

    expect(sawTrx).toBe(true);
  });

  it("commits on success (transaction.end)", async () => {
    const note = `${uniq}_commit`;

    await service.create(
      { note },
      {
        user: { archive_id: 1, role: "administrator" },
      },
    );

    const rows = await service.find({
      user: { archive_id: 1, role: "administrator" },
      query: { note, $disable_pagination: true },
    });
    expect(Array.isArray(rows)).toBe(true);
    expect(rows.length).toBe(1);
    expect(rows[0].archive_id).toBe(1);
  });

  it("rolls back on error (transaction.rollback)", async () => {
    const note = `${uniq}_rollback`;

    // Make this service's after.create hook fail to trigger app-level error hooks.
    service.hooks({
      after: {
        create: [
          async () => {
            throw new Error("__vitest_forced_after_create_error");
          },
        ],
      },
    });

    await expect(
      service.create(
        { note },
        {
          user: { archive_id: 1, role: "administrator" },
        },
      ),
    ).rejects.toThrow(/__vitest_forced_after_create_error/);

    const rows = await service.find({
      user: { archive_id: 1, role: "administrator" },
      query: { note, $disable_pagination: true },
    });
    expect(Array.isArray(rows)).toBe(true);
    expect(rows.length).toBe(0);
  });
});
