import dayjs from "dayjs";
import { isObject, isEqual, pick } from "lodash-es";
import { getDefaultValuesFromSchema } from "src/components/form/schemaUtils";

import { MEDIA_FIELD_SPECS, STATUS_LABELS } from "./compareConfig";

// Mark a path and all of its ancestors as different, e.g. "subjects.0.item" also marks "subjects.0" and "subjects"
const addDiff = (diffs, path) => {
  const keys = path ? path.split(".") : [];
  keys.forEach((_, index) => diffs.add(keys.slice(0, index + 1).join(".")));
};

// Returns the Set of paths that differ between two objects. A differing nested path also marks its parent paths.
export const compareObjects = (obj1, obj2, path = "", diffs = new Set()) => {
  if (!isObject(obj1) || !isObject(obj2)) {
    if (!isEqual(obj1, obj2)) {
      addDiff(diffs, path);
    }
    return diffs;
  }

  const allKeys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);

  allKeys.forEach((key) => {
    const currentPath = path ? `${path}.${key}` : key;
    const value1 = obj1[key];
    const value2 = obj2[key];
    // console.log("Comparing path:", currentPath, "value1:", value1, "value2:", value2);

    if (dayjs.isDayjs(value1) || dayjs.isDayjs(value2)) {
      if (!value1 || !dayjs(value1).isSame(value2)) {
        addDiff(diffs, currentPath);
      }
    } else if (isObject(value1) || isObject(value2)) {
      compareObjects(value1, value2, currentPath, diffs);
    } else if (!isEqual(value1 || "", value2 || "")) {
      addDiff(diffs, currentPath);
    }
  });
  // console.log("Diffs so far:", diffs);
  return diffs;
};

// The longest sequence of ids that appear in the same relative order in both lists
const longestCommonSubsequence = (a, b) => {
  const lengths = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      lengths[i][j] = a[i] === b[j] ? lengths[i + 1][j + 1] + 1 : Math.max(lengths[i + 1][j], lengths[i][j + 1]);
    }
  }
  const sequence = new Set();
  for (let i = 0, j = 0; i < a.length && j < b.length; ) {
    if (a[i] === b[j]) {
      sequence.add(a[i]);
      i++;
      j++;
    } else if (lengths[i + 1][j] >= lengths[i][j + 1]) {
      i++;
    } else {
      j++;
    }
  }
  return sequence;
};

// Compare two lists of related items by id. Each item on each side gets its 1-based position, its position on the
// other side (if any), and a status: "added" (only in current), "removed" (only in compare), "reordered" (for ordered
// lists, a shared item that is out of order relative to the others), or null. The fewest items possible are marked
// as reordered, so moving one item to the top flags just that item.
export const compareItemLists = (current, compare, idField, ordered = false) => {
  const currentItems = (current || []).filter((item) => !item.delete);
  const compareItems = compare || [];
  const positions = (items) => new Map(items.map((item, index) => [item[idField], index + 1]));
  const currentPositions = positions(currentItems);
  const comparePositions = positions(compareItems);
  const sharedIds = (items, otherPositions) => items.map((item) => item[idField]).filter((id) => otherPositions.has(id));
  const currentSharedIds = sharedIds(currentItems, comparePositions);
  const compareSharedIds = sharedIds(compareItems, currentPositions);

  const inOrder = ordered ? longestCommonSubsequence(currentSharedIds, compareSharedIds) : new Set(currentSharedIds);
  const annotate = (items, otherPositions, onlyStatus) =>
    items.map((item, index) => {
      const id = item[idField];
      const otherPosition = otherPositions.get(id) ?? null;
      let status = null;
      if (otherPosition === null) {
        status = onlyStatus;
      } else if (!inOrder.has(id)) {
        status = "reordered";
      }
      return { item, position: index + 1, otherPosition, status };
    });

  const currentEntries = annotate(currentItems, comparePositions, "added");
  const compareEntries = annotate(compareItems, currentPositions, "removed");

  // The current entries with the removed entries slotted in after the item that preceded them in the comparison
  // list (or at the start, if no earlier comparison item is still present). Removed entries have no position in
  // the current list; otherPosition is their position in the comparison list.
  const removedAfter = new Map();
  let anchor = null;
  compareEntries.forEach((entry) => {
    if (entry.status === "removed") {
      const removed = { ...entry, position: null, otherPosition: entry.position };
      removedAfter.set(anchor, [...(removedAfter.get(anchor) || []), removed]);
    } else {
      anchor = entry.item[idField];
    }
  });
  const currentWithRemoved = [
    ...(removedAfter.get(null) || []),
    ...currentEntries.flatMap((entry) => [entry, ...(removedAfter.get(entry.item[idField]) || [])]),
  ];

  return {
    current: currentEntries,
    compare: compareEntries,
    currentWithRemoved,
    onlyCurrent: currentItems.filter((item) => !comparePositions.has(item[idField])),
    onlyCompare: compareItems.filter((item) => !currentPositions.has(item[idField])),
    sharedCount: currentSharedIds.length,
    reorderedCount: currentSharedIds.length - inOrder.size,
  };
};

// Put an item from the comparison list back into the current list, after the nearest item that precedes it in the
// comparison list and is still in the current list (or at the start, if there is none)
export const insertAfterPredecessor = (list, compareList, item, idField) => {
  const presentIds = new Set((list || []).filter((entry) => !entry.delete).map((entry) => entry[idField]));
  const compareIndex = (compareList || []).findIndex((entry) => entry[idField] === item[idField]);
  const predecessor = (compareList || [])
    .slice(0, Math.max(compareIndex, 0))
    .reverse()
    .find((entry) => presentIds.has(entry[idField]));
  const index = predecessor ? list.findIndex((entry) => entry[idField] === predecessor[idField]) + 1 : 0;
  return [...(list || []).slice(0, index), item, ...(list || []).slice(index)];
};

const STATUS_ORDER = ["added", "removed", "changed", "reordered"];

// Summary of compared items' statuses (null for unchanged items), e.g. "2 added · 1 removed", or "No differences"
//   labels: a STATUS_LABELS set, for wording other than the statuses themselves
export const summarizeStatuses = (statuses, labels = STATUS_LABELS.versions) =>
  STATUS_ORDER.map((status) => [status, statuses.filter((s) => s === status).length])
    .filter(([, count]) => count)
    .map(([status, count]) => `${count} ${labels[status].toLowerCase()}`)
    .join(" · ") || "No differences";

// The schema fields (by name and nested path) that differ between two versions of an item. Only the displayed
// fields that exist in the current item are compared; media and related lists have their own comparisons.
export const getFieldDiffs = (service, schema, current, compare) => {
  const currentData = getDefaultValuesFromSchema(service, current);
  const compareData = getDefaultValuesFromSchema(service, compare);
  const pickFields = (data) =>
    Object.fromEntries(
      Object.keys(schema)
        .filter((key) => key in currentData && key in data)
        .map((key) => [key, data[key]]),
    );
  return compareObjects(pickFields(currentData), pickFields(compareData));
};

const MEDIA_FIELD_PATHS = MEDIA_FIELD_SPECS.map(({ path }) => path);
const mediaFieldValues = (media) => pick(media, MEDIA_FIELD_PATHS);

// Items restored from a saved version are created as new media, so they no longer share a media_id with their
// source. Match each current item whose media_id isn't in the comparison version to an unmatched comparison item
// with the same field values: { current media_id: comparison media_id }
export const matchMediaByContent = (currentMedia, compareMedia) => {
  const currentIds = new Set((currentMedia || []).map(({ media_id }) => media_id));
  const compareIds = new Set((compareMedia || []).map(({ media_id }) => media_id));
  const unmatched = (compareMedia || []).filter(({ media_id }) => !currentIds.has(media_id));
  const matches = {};
  (currentMedia || [])
    .filter(({ media_id }) => media_id && !compareIds.has(media_id))
    .forEach((media) => {
      const index = unmatched.findIndex(
        (other) => compareObjects(mediaFieldValues(media), mediaFieldValues(other)).size === 0,
      );
      if (index !== -1) {
        matches[media.media_id] = unmatched.splice(index, 1)[0].media_id;
      }
    });
  return matches;
};

// Pair up the current and comparison media items by media_id. Each pair's mediaId is its comparison media_id, if
// it has one.
//   addedMediaIds: the comparison media_ids of items restored into the current record, in the order they were added
//   contentMatches: a matchMediaByContent result, pairing items with different media_ids
export const pairMediaItems = (currentMedia, compareMedia, addedMediaIds = [], contentMatches = {}) => {
  // Index compare items by media_id for O(1) lookup
  const compareMediaById = Object.fromEntries(
    (compareMedia || []).map((media, index) => [media.media_id, { media, index }]),
  );

  // Step through current data and look up compare matches. Loaded items always have a media_id; restored items
  // have a null media_id (so they are created on save) and are matched to their source by the order they were added
  let addedCount = 0;
  const allPairs = (currentMedia || []).map((media, index) => {
    const isAdded = !media.media_id;
    const mediaId = String(isAdded ? addedMediaIds[addedCount++] : (contentMatches[media.media_id] ?? media.media_id));
    const compareItem = compareMediaById[mediaId] || null;

    return {
      mediaId,
      current: { media, index },
      compare: compareItem,
      isMatched: !!compareItem, // Track whether this pair has both sides
      isAdded,
    };
  });

  // Add compare-only items (not matched with current)
  const currentMediaIds = new Set(allPairs.map(({ mediaId }) => mediaId));
  Object.entries(compareMediaById).forEach(([mediaId, compareItem]) => {
    if (!currentMediaIds.has(mediaId)) {
      allPairs.push({
        mediaId,
        current: null,
        compare: compareItem,
        isMatched: false,
        isAdded: false,
      });
    }
  });
  return allPairs;
};

// A media item pair's status relative to the comparison version: "removed" (only in the comparison version,
// including items since restored into the current record), "added" (only in the current record), "changed" (in
// both, with differing fields) or null
export const getMediaStatus = ({ current, isMatched, isAdded }, hasFieldDiffs) => {
  if (!current || isAdded) {
    return "removed";
  }
  if (!isMatched) {
    return "added";
  }
  return hasFieldDiffs ? "changed" : null;
};

// Compare the media as loaded, so the comparison stays stable as the media is edited: the items matched by content
// (see matchMediaByContent) and the differing paths of each matched pair (diffs: mediaId -> Set of paths)
export const getMediaComparison = (currentMedia, compareMedia) => {
  const contentMatches = matchMediaByContent(currentMedia, compareMedia);
  const diffs = Object.fromEntries(
    pairMediaItems(currentMedia, compareMedia, [], contentMatches)
      .filter(({ isMatched }) => isMatched)
      .map(({ mediaId, current, compare }) => [mediaId, compareObjects(current.media, compare.media)]),
  );
  return { contentMatches, diffs };
};

const NO_DIFFS = new Set();

// The media item pairs (see pairMediaItems), each with its differing paths (itemDiffs), the compared fields that
// differ (diffSpecs) and its status (see getMediaStatus).
//   comparison: a getMediaComparison result
export const getMediaPairs = (currentMedia, compareMedia, { contentMatches, diffs }, addedMediaIds) =>
  pairMediaItems(currentMedia, compareMedia, addedMediaIds, contentMatches).map((pair) => {
    const itemDiffs = diffs[pair.mediaId] ?? NO_DIFFS;
    const diffSpecs = MEDIA_FIELD_SPECS.filter(({ path }) => itemDiffs.has(path));
    return { ...pair, itemDiffs, diffSpecs, status: getMediaStatus(pair, diffSpecs.length > 0) };
  });
