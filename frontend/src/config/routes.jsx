export const ROLE_HIERARCHY = ["intern", "staff", "administrator"];

export const routeConfig = {
  Collections: {
    icon: "library_books",
    routes: [
      {
        path: "collections",
        component: "./views/CollectionsView.jsx",
        sidebar: {
          label: "Manage Collections",
          icon: "",
          pattern: new RegExp(`^/admin/collections(\/[0-9]+)?$`),
        },
      },
      {
        path: "collections/new",
        sidebar: {
          label: "New Collection",
          icon: "",
        },
      },
      {
        path: "collections/:id",
        component: "./views/CollectionView.jsx",
      },
    ],
  },

  Records: {
    icon: "description",
    routes: [
      // {
      //   path: "",
      //   redirect: "/admin/records",
      // },
      // {
      //   path: "search",
      //   component: "PublicSearch",
      //   sidebar: {
      //     label: "Search Records",
      //     icon: "",
      //   },
      // },
      {
        path: "records",
        component: "./views/RecordsView.jsx",
        sidebar: {
          label: "Manage Records",
          icon: "",
          pattern: new RegExp(`^/admin/records(\/[0-9]+)?$`),
        },
      },
      {
        path: "records/new",
        sidebar: {
          label: "New Record",
          icon: "",
        },
      },
      {
        path: "records/table",
        component: "./views/RecordsTable/RecordsTableView.jsx",
        authRole: "staff",
        sidebar: {
          label: "Table View",
          icon: "",
        },
      },
      {
        path: "records/:id",
        component: "./views/RecordView.jsx",
        props: { showForm: true },
      },
    ],
  },

  "Site Management": {
    icon: "settings",
    routes: [
      {
        path: "site/settings",
        component: "./views/SiteSettings.jsx",
        authRole: "staff",
        sidebar: {
          label: "Site Settings",
          icon: "",
        },
      },
      {
        path: "site/featured-records",
        component: "./views/CollectionView.jsx",
        authRole: "staff",
        sidebar: {
          label: "Manage Featured Records",
          icon: "",
        },
      },
      {
        path: "site/featured-collections",
        component: "./views/CollectionView.jsx",
        authRole: "staff",
        sidebar: {
          label: "Manage Featured Collections",
          icon: "",
        },
      },
      {
        path: "site/edit-list-values",
        component: "./views/EditLists.jsx",
        authRole: "staff",
        sidebar: {
          label: "Edit List Values",
          icon: "",
        },
      },
      {
        path: "site/data-cleanup",
        component: "./views/DataCleanup.jsx",
        authRole: "staff",
        sidebar: {
          label: "Data Cleanup",
          icon: "",
        },
      },
      // {
      //   // path: "export-collections",
      //   authRole: "staff",
      //   sidebar: {
      //     label: "Export Collections",
      //     icon: "",
      //   },
      // },
      {
        path: "site/find-duplicates/:id1?/:id2?",
        component: "./views/FindDuplicateRecords.jsx",
        authRole: "staff",
        sidebar: {
          sidebarPath: "site/find-duplicates",
          label: "Find Duplicate Records",
          icon: "",
        },
      },
      {
        path: "site/find-duplicate-list-items/:type?",
        component: "./views/FindDuplicateListItems.jsx",
        authRole: "staff",
        sidebar: {
          sidebarPath: "site/find-duplicate-list-items",
          label: "Find Duplicate List Items",
          icon: "",
        },
      },
      {
        path: "site/review-changes",
        component: "./views/ReviewChanges.jsx",
        authRole: "administrator",
        sidebar: {
          label: "Review Changes",
          icon: "",
        },
      },
    ],
  },

  Admin: {
    icon: "admin_panel_settings",
    routes: [
      {
        path: "admin/relationships/:skip?",
        component: "./views/Relationships.jsx",
        authRole: "administrator",
        sidebar: {
          label: "Update Unknown Relationships",
          icon: "",
        },
      },
      {
        path: "admin/users",
        component: "./views/Users.jsx",
        authRole: "administrator",
        sidebar: {
          label: "Manage Users",
          icon: "",
        },
      },
      {
        path: "admin/publish-site",
        component: "./views/PublishSite.jsx",
        authRole: "administrator",
        sidebar: {
          label: "Publish/Restore Live Site",
          icon: "",
        },
      },
    ],
  },
};

export function hasAccess(userRole, requiredRole) {
  if (!requiredRole) return true;
  const userLevel = ROLE_HIERARCHY.indexOf(userRole);
  const requiredLevel = ROLE_HIERARCHY.indexOf(requiredRole);
  // console.log({userRole, requiredRole, userLevel, requiredLevel}) 
  return userLevel >= requiredLevel;
}

export const sidebarConfig = {};

export const routes = Object.entries(routeConfig).reduce((acc, [sectionName, section]) => {
  const sectionRoutes = [];
  (section.routes || []).forEach((routeConfig) => {
    const { path, sidebar, ...config } = routeConfig;
    if (config.component || config.redirect) {
      acc[path] = [path, config];
    }
    if (sidebar) {
      const { authRole } = config;
      const { label, icon, sidebarPath, pattern } = sidebar;
      sectionRoutes.push({
        label,
        icon,
        href: path,
        pattern: pattern || path,
        authRole,
        sidebarPath: sidebarPath || path,
      });
    }
  });
  if (sectionRoutes.length > 0) {
    sidebarConfig[sectionName] = {
      icon: section.icon,
      routes: sectionRoutes,
    };
  }
  return acc;
}, {});

export function currentRouteConfig(matches = []) {
  const route = matches.at(-1);
  return routes[route?.id]?.[1]
}