import { collectionSelectFields, recordSelectFields } from "src/config/constants";

const recordSchema = {
  title: {},
  description: { field_type: "textarea" },
  is_hidden: { field_type: "checkbox" },
  needs_review: { field_type: "checkbox" },
  authors: { multiple: true, field_type: "list_item", itemType: "author" },
  producers: { multiple: true, field_type: "list_item", itemType: "producer" },
  keywords: { multiple: true, field_type: "list_item", itemType: "keyword" },
  subjects: { multiple: true, field_type: "list_item", itemType: "subject" },
  collection: { field_type: "editableItem", service: "collections" },
  vol_number: {},
  program: { field_type: "list_item", itemType: "program" },
  publishers: { multiple: true, field_type: "list_item", itemType: "publisher" },
  location: {},
  date_string: {
    field_type: "datestring",
    label: "Date",
    helperText: "MM/DD/YYYY format - enter '00' for unknown day or month",
  },
  year_is_circa: { field_type: "checkbox", label: "Approximate Date" },
  fact_number: {},
  notes: { field_type: "textarea" },
};

const collectionSchema = {
  title: {},
  description: { field_type: "html" },
  call_number_item: { field_type: "list_item", itemType: "call_number", label: "Call Number", fetchAll: true },
  call_number_suffix: { label: "Suffix" },
  parent: { field_type: "editableItem", service: "collections" },
  is_hidden: { field_type: "checkbox" },
  needs_review: { field_type: "checkbox" },
  publishers: { multiple: true, field_type: "list_item", itemType: "publisher" },
  date_range: {},
  keywords: { multiple: true, field_type: "list_item", itemType: "keyword" },
  subjects: { multiple: true, field_type: "list_item", itemType: "subject" },
  summary: { field_type: "textarea" },
  notes: { field_type: "textarea" },
};

// Field props for each compared field of a record's media items
export const MEDIA_FIELD_SPECS = [
  { path: "is_primary", label: "Primary", field_type: "checkbox" },
  { path: "call_number_item", label: "Call Number", field_type: "list_item", itemType: "call_number", fetchAll: true },
  { path: "call_number_suffix", label: "Suffix" },
  { path: "generation_item", label: "Generation", field_type: "list_item", itemType: "generation", fetchAll: true },
  { path: "format_item", label: "Format", field_type: "list_item", itemType: "format", fetchAll: true },
  { path: "quality_item", label: "Quality", field_type: "list_item", itemType: "quality", fetchAll: true },
  { path: "no_copies", label: "Copies", type: "number" },
  { path: "url", label: "URL" },
];

// Labels for compared items' statuses. Comparing with a saved version, items were added, removed or changed since
// then; comparing two different items (duplicates), they are only in one or the other, or different.
export const STATUS_LABELS = {
  versions: { added: "Added", removed: "Removed", changed: "Changed", reordered: "Reordered" },
  duplicates: {
    added: "Only in this record",
    removed: "Only in the other record",
    changed: "Different",
    reordered: "Reordered",
  },
};

// Compare settings for each item type, keyed by the version_history type
//   schema: Field props for each compared field
//   fields: sections of field names, in display order
//   hasMedia: compare the item's media
//   relationLists: lists of related items that are compared (and synced) as a whole
export const COMPARE_CONFIG = {
  record: {
    service: "records",
    label: "Record",
    selectFields: recordSelectFields,
    schema: recordSchema,
    fields: [{ fields: Object.keys(recordSchema) }],
    hasMedia: true,
  },
  collection: {
    service: "collections",
    label: "Collection",
    selectFields: collectionSelectFields,
    schema: collectionSchema,
    fields: [{ fields: Object.keys(collectionSchema) }],
    relationLists: [
      { name: "featured_records", label: "Featured Records", type: "record", ordered: true },
      { name: "children", label: "Subcollections", type: "collection", ordered: true },
      { name: "child_records", label: "Records", type: "record" },
    ],
  },
};
