import { KnexService } from "@feathersjs/knex";
import { stripHtml } from "string-strip-html";

import {
  fetchUnified,
  prepListItemRelations,
  refreshView,
  setUser,
  updateListItemRelations,
  updateThumbnail,
  updateVersionHistory,
} from "./common_hooks/index.js";

class Collections extends KnexService {
  constructor(options) {
    super({
      ...options,
      name: "collections",
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
    id: "collection_id",
    Model: app.get("postgresqlClient"),
    paginate: app.get("paginate"),
  };
  // Initialize our service with any options it requires
  app.use("/api/collections", new Collections(options));
  // Get our initialized service so that we can register hooks
  const service = app.service("api/collections");
  const updateRelations = async (context) => {
    const {
      app,
      params: {
        user,
        transaction: { trx },
      },
      data,
      relation_data = {},
    } = context;
    const id = context.id || context.result.collection_id;
    if (!Object.keys(data).length) {
      context.result = await trx("collections").where("collection_id", id).select();
    }
    if (relation_data.children !== undefined) {
      let index = 0;
      await Promise.all(
        relation_data.children.map((child) => {
          if (child.delete) {
            return app
              .service("api/collections")
              .patch(child.collection_id, { parent_collection_id: null }, { user, transaction: { trx } });
          } else if (child.collection_id) {
            return app
              .service("api/collections")
              .patch(
                child.collection_id,
                { parent_collection_id: id, display_order: index++ },
                { user, transaction: { trx } },
              );
          }
        }),
      );
    }
    if (relation_data.child_records !== undefined) {
      await Promise.all(
        relation_data.child_records.map((child) => {
          if (child.delete) {
            return app
              .service("api/records")
              .patch(child.record_id, { collection_id: 1000 }, { user, transaction: { trx } });
          } else if (child.record_id) {
            return app
              .service("api/records")
              .patch(child.record_id, { collection_id: id }, { user, transaction: { trx } });
          }
        }),
      );
    }
    if (relation_data.featured_records !== undefined) {
      const { deleteIds, updateRecords } = relation_data.featured_records.reduce(
        (acc, record) => {
          if (record.delete) {
            acc.deleteIds.push(record.record_id);
          } else {
            acc.updateRecords.push({
              archive_id: user.archive_id,
              record_id: record.record_id,
              collection_id: id,
              record_order: acc.updateRecords.length + 1,
              label: record.label,
            });
          }
          return acc;
        },
        { deleteIds: [], updateRecords: [] },
      );
      if (deleteIds.length) {
        await trx.from("featured_records").where("collection_id", id).whereIn("record_id", deleteIds).delete();
      }
      if (updateRecords.length) {
        await trx
          .from("featured_records")
          .insert(updateRecords)
          .onConflict(["archive_id", "collection_id", "record_id"])
          .merge();
      }
    }
    return context;
  };
  const updateChildren = async (context) => {
    const { id, params, app } = context;
    const { user, transaction } = params;
    const children = await app.service("api/records").find({
      query: { $select: ["record_id"], collection_id: id },
      paginate: false,
    });
    await Promise.all(
      children.map(({ record_id }) => {
        return app.service("api/records").patch(record_id, { collection_id: 1000 }, { user, transaction });
      }),
    );
    const childCollections = await app.service("api/collections").find({
      query: { $select: ["collection_id"], parent_collection_id: id },
      paginate: false,
    });
    await Promise.all(
      childCollections.map(({ collection_id }) => {
        return app
          .service("api/collections")
          .patch(collection_id, { parent_collection_id: 0 }, { user, transaction });
      }),
    );
    return context;
  };
  const prepData = (context) => {
    const { data } = context;
    if (data && Object.keys(data).length) {
      const relation_data = {};
      // remove calculated fields
      Object.keys(data).forEach((key) => {
        if (["add_new_record"].includes(key) || key.match("_search")) {
          delete data[key];
        }
      });
      ["child_records", "children", "featured_records", "thumbnail"].forEach((key) => {
        if (data[key]) {
          relation_data[key] = data[key];
          delete data[key];
        }
      });
      if ("publisher" in data) {
        data[`publisher_id`] = data["publisher"] ? data["publisher"].list_item_id : null;
        delete data["publisher"];
      }
      if ("call_number_item" in data) {
        data.call_number_id = data.call_number_item?.list_item_id;
        delete data.call_number_item;
      }
      // if ('collection' in data) {
      //   data.collection_id = data.collection ? data.collection.collection_id : null;
      //   delete data.collection;
      // }
      if ("parent" in data) {
        data.parent_collection_id = data.parent ? data.parent.collection_id : null;
        delete data.parent;
      }
      context.relation_data = relation_data;
      if ("description" in data) {
        data.description_search = stripHtml(data.description).result.trim().toLowerCase();
      }
    }
    prepListItemRelations(context);
    return context;
  };

  service.hooks({
    before: {
      all: [prepData],
      get: [fetchUnified],
      find: [fetchUnified],
      create: [setUser],
      patch: [setUser, updateVersionHistory, updateListItemRelations, updateRelations],
      remove: [setUser, updateChildren],
    },
    after: {
      all: [],
      create: [updateListItemRelations, updateThumbnail, updateRelations, refreshView],
      update: [refreshView],
      patch: [updateThumbnail, refreshView],
      remove: [refreshView],
    },
    error: {
      all: [],
      create: [],
      patch: [],
      remove: [],
    },
  });
});
