import configuration from "@feathersjs/configuration";
import feathersExpress, { errorHandler, json, notFound, rest, urlencoded } from "@feathersjs/express";
import { feathers } from "@feathersjs/feathers";
import { createRequestHandler } from "@react-router/express";
import compress from "compression";
import cors from "cors";
import express from 'express';
import helmet from "helmet";
import path, { dirname } from "path";
import qs from "qs";
import favicon from "serve-favicon";
import { fileURLToPath } from "url";

import appHooks from "./app.hooks.js";
import authentication from "./authentication.js";
import logger from "./logger.js";
import dbMaintenance from "./middleware/dbMaintenance.js";
import middleware from "./middleware/index.js";
import knex from "./postgresql.js";
import services from "./services/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const expressApp = express();
expressApp.set("query parser", function (str) {
  return qs.parse(str, { strictNullHandling: true, arrayLimit: Infinity });
});

const app = /** @type {any} */ (feathersExpress)(feathers(), expressApp);
app.configure(configuration());
// Set up Plugins and providers
app.set('publicPath', path.resolve(__dirname, app.get("public"))); // Adjust relative path as necessary
const frontendDistPath = path.resolve(__dirname, '../public_dist/');
const clientDistPath = path.resolve(frontendDistPath, 'client');
const serverDistPath = path.resolve(frontendDistPath, 'server');

// Load app configuration
// Enable security, CORS, compression, favicon and body parsing
app.use(
  helmet({
    contentSecurityPolicy: false,
  }),
);

app.use(cors());
app.use(compress());
app.use(json({ limit: "13mb" }));
app.use(urlencoded({ extended: true }));

app.configure(middleware);
app.configure(rest());
app.use(favicon(path.join(clientDistPath, "favicon.ico")));

// Sitemap and robots.txt routes
expressApp.get('/robots.txt', (req, res) => {
  res.type('text/plain').sendFile(path.join(app.get('publicPath'), 'robots.txt'));
});

expressApp.get('/sitemap.xml', (req, res) => {
  res.type('application/xml').sendFile(path.join(app.get('publicPath'), 'sitemap.xml'));
});

// Host the public folder
app.use("/", express.static(clientDistPath, { index: false }));
// Configure a middleware for 404s and the error handler
app.configure(knex);

// Gracefully degrade when the DB is offline.
app.configure(dbMaintenance);

app.configure(authentication);
// Set up our services (see `services/index.js`)
app.configure(services);

app.hooks(appHooks);

// redirect old search urls
expressApp.get("/search.php", (req, res) => {
  const collectionId = req.query.view_collection;
  if (collectionId) {
    return res.redirect(301, `/collections/${collectionId}`);
  }
  return res.redirect(301, `/search`);
});

// Express 5 / path-to-regexp v6 doesn't accept "*" as a path pattern.
// Use a regex catch-all instead.

expressApp.get(/.*/, async (request, response, next) => {
  if (request.path.startsWith("/api/") || request.path.startsWith("/images/")) {
    return next();
  }

  try {
    const serverBuild = await import(path.join(serverDistPath, "index.js"));
    return createRequestHandler({ build: serverBuild })(request, response, next);
  } catch (err) {
    return next(err);
  }
});
// Configure a middleware for 404s and the error handler
app.use(notFound());

app.use((err, req, res, next) => {
  err.requestId = req.requestId;
  err.url = req.originalUrl || req.url;
  err.method = req.method;
  next(err);
});

app.use(
  errorHandler({
    logger,
  }),
);
export default app;
