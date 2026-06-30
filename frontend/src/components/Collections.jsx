import { cloneDeep } from "lodash-es";
import { useCallback } from "react";

import Manage from "./Manage";

const filter_types = {
  title: { input: "text", match: "fuzzy" },
  call_number: { input: "text", match: "fuzzy", case: "upper" },
  description: { input: "text", match: "fuzzy" },
  summary: { input: "text", match: "fuzzy" },
  notes: { input: "text", match: "fuzzy" },
  publishers: { input: "listitem", match: "listitem" },
  keywords: { input: "listitem", match: "listitem" },
  subjects: { input: "listitem", match: "listitem" },
};

const sort_options = {
  relevance: {
    label: "Search Relevance",
    sort: { rank: 1, display_order: -1, title: -1, date_created: 1 },
    sort_desc: true,
  },
  title: {
    label: "Collection Name",
    sort: { title: 1, display_order: 1, rank: -1, date_created: -1 },
  },
  date_modified: {
    label: "Date Modified",
    sort: { date_modified: 1, display_order: -1, rank: 1, title: -1 },
    sort_desc: true,
  },
  date_created: {
    label: "Date Created",
    sort: { date_created: 1, display_order: -1, rank: 1, title: -1 },
    sort_desc: true,
  },
  call_number: { label: "Call Number", sort: { call_number: 1, display_order: 1, rank: -1, title: 1 } },
};

export function Collections({ embedded, itemAction, filter, forcedFilter, useStore }) {
  const createQuery = useCallback(
    (filter) => {
      const { search, hidden, needs_review, sort = "relevance", sort_desc = false } = filter;
      const query = {
        $select: ["collection_id", "title", "summary", "thumbnail", "parent", "call_number"],
        ...(forcedFilter || {}),
      };
      if (!hidden) {
        query.is_hidden = false;
      }
      if (needs_review) {
        query.needs_review = true;
      }
      query.$sort = cloneDeep(sort_options[sort].sort);
      if (search) {
        query.$fullText = search;
      } else {
        delete query.$sort.rank;
      }
      if (sort_desc) {
        for (const key in query.$sort) {
          query.$sort[key] *= -1;
        }
      }
      return query;
    },
    [forcedFilter],
  );

  return (
    <Manage
      defaultFilter={filter || {}}
      createQuery={createQuery}
      filterTypes={filter_types}
      service="collections"
      embedded={embedded}
      itemAction={itemAction}
      searchHelperText={"Search name, description, summary, keywords, subjects, and call number"}
      useStore={useStore}
      sortOptions={sort_options}
    />
  );
}

export default Collections;
