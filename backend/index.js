import app from "./app.js";
import logger from "./logger.js";

const hostname = app.get("host");
const port = app.get("port");
// app.listen(port, hostname);
// console.log(app);
const server = app.listen(port, hostname);
app.setup(server).then(() => {
  logger.info("Feathers server listening on http://%s:%s", hostname, port);
});
process.on("unhandledRejection", (reason, _p) => {
  const isError = reason instanceof Error;
  logger.error("Unhandled Rejection at promise", {
    reason: isError ? reason.message : reason,
    stack: isError ? reason.stack : undefined,
  });
});

process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception", { message: err?.message, name: err?.name, stack: err?.stack });

  // Attempt a graceful shutdown: stop accepting new connections and allow
  server.close(() => process.exit(1));
  setTimeout(() => process.exit(1), 5000).unref();
});
