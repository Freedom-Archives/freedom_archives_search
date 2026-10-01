import { authenticate } from "@feathersjs/authentication";
import { transaction } from "@feathersjs/knex";

import logger from "./logger.js";
import { allowAnonymous, allowDisablePagination, authRoles, debugQuery, setArchive } from "./services/common_hooks/index.js";
// Application hooks that run for every service
const public_services = ["api/public/records", "api/public/settings", "api/public/collections"];

const attachRequestId = async (context) => {
  const requestId = context.params?.req?.requestId;
  if (requestId) {
    context.params.requestId = requestId;
  }
  return context;
};

const checkAuth = async (context) => {
  if (public_services.includes(context.path)) {
    allowAnonymous()(context);
    return authenticate("jwt", "anonymous")(context);
  } else if (context.path !== "api/authentication") {
    return authenticate("jwt")(context);
  }
  return context;
};

export const before = {
  all: [
    attachRequestId,
    checkAuth,
    authRoles,
    // logHook,
  ],
  find: [allowDisablePagination],
  get: [],
  create: [transaction.start(), setArchive], // FIXME for new archives/archive users
  update: [transaction.start()],
  patch: [transaction.start()],
  remove: [transaction.start()],
};
export const after = {
  all: [
    debugQuery,
    // logHook,
  ],
  find: [],
  get: [],
  create: [transaction.end()],
  update: [transaction.end()],
  patch: [transaction.end()],
  remove: [transaction.end()],
};
export const error = {
  all: [
    async (context) => {
      const err = context.error;
      const meta = {
        path: context.path,
        method: context.method,
        hookType: context.type,
        id: context.id,
        requestId: context.params?.requestId,
        data: err?.data,
      };

      if (context.path === "api/authentication" && err?.message === "NotAuthenticated: jwt expired") {
        logger.warn("Auth error", { ...meta, message: err?.message });
      } else {
        if (err instanceof Error) {
          const feathersErr = /** @type {any} */ (err);
          logger.error(err.message, {
            ...meta,
            name: err.name,
            code: feathersErr.code,
            className: feathersErr.className,
            stack: err.stack,
          });
        } else {
          logger.error("Error in service method", { ...meta, err });
        }
      }

      return context;
    },
  ],
  find: [],
  get: [],
  create: [transaction.rollback()],
  update: [transaction.rollback()],
  patch: [transaction.rollback()],
  remove: [transaction.rollback()],
};
export default {
  before,
  after,
  error,
};
