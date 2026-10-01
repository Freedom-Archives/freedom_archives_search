import { type RouteConfig, route, index, layout } from "@react-router/dev/routes";

import {routes as adminRouteConfig} from "./config/routes.jsx";

const adminRoutes = Object.entries(adminRouteConfig as Record<string, [string, {component: string}]>)
  .map(([path, [, {component}]]) => route(path, component, {id: path}));

export default [
  route("/", "./layouts/PublicLayout.jsx", [
    index("./public/PublicHome.jsx"),
    route("collections/:collection_id", "./public/PublicCollections.jsx"),
    route("search", "./public/PublicSearch/PublicSearch.jsx"),
    route("*", "./views/NotFound.jsx"),
  ]),
  route("/admin", "./layouts/Layout.jsx", [
    // Public admin routes (login, forbidden)
    route("login", "./views/Login.jsx"),
    route("forbidden", "./views/Forbidden.jsx"),
    route("*", "./views/NotFound.jsx", { id: "admin-not-found" }),

    layout("./layouts/Auth.jsx", [
      index("./views/Home.jsx"),
      ...adminRoutes,
    ]),
  ]),
] satisfies RouteConfig;

