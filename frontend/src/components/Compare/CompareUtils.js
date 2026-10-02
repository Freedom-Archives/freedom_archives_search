import dayjs from "dayjs";
import { isObject, isEqual } from "lodash-es";

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

// Calculate diffs for each media item pair, matched by media_id: mediaId -> Set of differing paths
export const getMediaDiffs = (currentMedia, compareMedia) => {
  const compareById = Object.fromEntries((compareMedia || []).map((m) => [m.media_id, m]));
  const diffs = {};
  (currentMedia || []).forEach((m) => {
    if (compareById[m.media_id]) {
      diffs[m.media_id] = compareObjects(m, compareById[m.media_id]);
    }
  });
  return diffs;
};
