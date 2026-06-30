import { cloneDeep } from "lodash-es";
import { useCallback } from "react";

import Manage from "./Manage";

const filter_types = {
  day: { input: "simpleSelect", match: "exact", allowNull: true },
  description: { input: "text", match: "fuzzy" },
  // 'file_extension': { input: 'text', match: 'exact' },
  location: { input: "text", match: "fuzzy" },
  month: { input: "simpleSelect", match: "exact", allowNull: true },
  title: { input: "text", match: "fuzzy" },
  vol_number: { input: "text", match: "fuzzy" },
  year: { input: "simpleSelect", match: "exact", allowNull: true },
  authors: { input: "listitem", match: "listitem" },
  subjects: { input: "listitem", match: "listitem" },
  keywords: { input: "listitem", match: "listitem" },
  producers: { input: "listitem", match: "listitem" },
  programs: { input: "listitem", match: "listitem_id" },
  publishers: { input: "listitem", match: "listitem" },
  call_numbers_text: { label: "Call Number", input: "text", match: "fuzzy", case: "upper" },
  formats: { input: "listitem", match: "contained" },
  qualitys: { input: "listitem", match: "contained" },
  generations: { input: "listitem", match: "contained" },
  record_type: { input: "simpleSelect", match: "exact" },
  notes: { input: "text", match: "fuzzy" },
  is_hidden: { input: "checkbox", match: "exact", label: "Hidden" },
  fact_number: { input: "text", match: "fuzzy" },
};

const sort_options = {
  relevance: { label: "Search Relevance", sort: { rank: 1, title: -1, date_created: 1 }, sort_desc: true },
  title: { label: "Title", sort: { title: 1, rank: -1, date_created: -1 } },
  date_modified: { label: "Date Modified", sort: { date_modified: 1, rank: 1, title: -1 }, sort_desc: true },
  date_created: { label: "Date Created", sort: { date_created: 1, rank: 1, title: -1 }, sort_desc: true },
  call_number: { label: "Call Number", sort: { call_numbers: 1, rank: -1, title: 1 } },
};

export function Records({ embedded, itemAction, filter, forcedFilter, useStore }) {
  const createQuery = useCallback(
    (formFilter) => {
      const {
        search,
        non_digitized,
        hidden,
        needs_review,
        collection_id,
        sort = "relevance",
        sort_desc = false,
      } = formFilter;

      const query = {
        // $sort: { title: 1 },
        $select: [
          "record_id",
          "title",
          "collection",
          "has_digital",
          "description",
          "record_type",
          "primary_media_format_text",
          "call_numbers",
        ],
        ...(forcedFilter || {}),
      };
      if (!non_digitized) {
        query.has_digital = true;
      }
      if (!hidden) {
        query.is_hidden = false;
      }
      if (needs_review) {
        query.needs_review = true;
      }
      if (collection_id != null) {
        query.collection_id = collection_id;
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
      service="records"
      embedded={embedded}
      itemAction={itemAction}
      searchHelperText="Search title, description, keywords, producers, and call number"
      useStore={useStore}
      sortOptions={sort_options}
    />
  );
}

export default Records;
