import dayjs from "dayjs";
import { describe, expect, it } from "vitest";

import {
  compareItemLists,
  compareObjects,
  getMediaComparison,
  getMediaPairs,
  insertAfterPredecessor,
  matchMediaByContent,
  pairMediaItems,
  summarizeStatuses,
} from "./CompareUtils";

describe("compareObjects", () => {
  it("returns no diffs for equal objects", () => {
    const diffs = compareObjects({ title: "A", tags: [{ id: 1 }] }, { title: "A", tags: [{ id: 1 }] });
    expect(diffs.size).toBe(0);
  });

  it("flags differing top-level values", () => {
    const diffs = compareObjects({ title: "A", notes: "same" }, { title: "B", notes: "same" });
    expect([...diffs]).toEqual(["title"]);
  });

  it("treats null, undefined and empty string as equal", () => {
    const diffs = compareObjects({ a: null, b: "", c: undefined }, { a: "", b: undefined, c: null });
    expect(diffs.size).toBe(0);
  });

  it("flags keys that only exist on one side", () => {
    expect(compareObjects({ a: 1 }, { a: 1, b: 2 }).has("b")).toBe(true);
    expect(compareObjects({ a: 1, b: 2 }, { a: 1 }).has("b")).toBe(true);
  });

  it("marks every ancestor of a nested difference", () => {
    const current = { subjects: [{ item: "Abortion", list_item_id: 1 }] };
    const compare = { subjects: [{ item: "Prison", list_item_id: 2 }] };
    const diffs = compareObjects(current, compare);
    expect(diffs).toEqual(new Set(["subjects", "subjects.0", "subjects.0.item", "subjects.0.list_item_id"]));
  });

  it("flags the field when an array item only exists on one side", () => {
    const current = {
      subjects: [
        { item: "A", list_item_id: 1 },
        { item: "B", list_item_id: 2 },
      ],
    };
    const compare = { subjects: [{ item: "A", list_item_id: 1 }] };
    const diffs = compareObjects(current, compare);
    expect(diffs).toEqual(new Set(["subjects", "subjects.1"]));
  });

  it("flags an object compared with an empty value", () => {
    const diffs = compareObjects({ program: { item: "A", list_item_id: 1 } }, { program: null });
    expect(diffs.has("program")).toBe(true);
  });

  it("never adds an empty path", () => {
    expect(compareObjects({ a: 1 }, { a: 2 }).has("")).toBe(false);
    expect(compareObjects("a", "b").size).toBe(0);
  });

  it("compares dayjs values by date", () => {
    const date = dayjs("2020-01-01");
    expect(compareObjects({ date }, { date: dayjs("2020-01-01") }).size).toBe(0);
    expect(compareObjects({ date }, { date: dayjs("2021-01-01") }).has("date")).toBe(true);
  });

  it("does not throw when only one side is a dayjs value", () => {
    const date = dayjs("2020-01-01");
    expect(compareObjects({ date: "2020-01-01" }, { date }).size).toBe(0);
    expect(compareObjects({ date: null }, { date }).has("date")).toBe(true);
    expect(compareObjects({ date }, { date: null }).has("date")).toBe(true);
  });
});

describe("compareItemLists", () => {
  const record = (record_id) => ({ record_id, title: `Record ${record_id}` });

  const statuses = (entries) => entries.map(({ item, status }) => [item.record_id, status]);

  it("splits items into current-only, compare-only and shared", () => {
    const result = compareItemLists([record(1), record(2), record(3)], [record(2), record(3), record(4)], "record_id");
    expect(result.onlyCurrent).toEqual([record(1)]);
    expect(result.onlyCompare).toEqual([record(4)]);
    expect(result.sharedCount).toBe(2);
    expect(result.reorderedCount).toBe(0);
  });

  it("marks each side's items as added, removed or unchanged, keeping each side's order", () => {
    const result = compareItemLists([record(1), record(2), record(3)], [record(2), record(3), record(4)], "record_id");
    expect(statuses(result.current)).toEqual([
      [1, "added"],
      [2, null],
      [3, null],
    ]);
    expect(statuses(result.compare)).toEqual([
      [2, null],
      [3, null],
      [4, "removed"],
    ]);
  });

  it("slots removed items into the current list after the item that preceded them", () => {
    const current = [record(1), record(3), record(5)];
    const compare = [record(1), record(2), record(3), record(4), record(6)];
    const result = compareItemLists(current, compare, "record_id");
    expect(statuses(result.currentWithRemoved)).toEqual([
      [1, null],
      [2, "removed"],
      [3, null],
      [4, "removed"],
      [6, "removed"],
      [5, "added"],
    ]);
  });

  it("gives slotted-in removed items no current position, keeping their comparison position", () => {
    const result = compareItemLists([record(2)], [record(1), record(2)], "record_id");
    expect(result.currentWithRemoved[0]).toMatchObject({ position: null, otherPosition: 1, status: "removed" });
  });

  it("puts removed items that came first at the start of the current list", () => {
    const result = compareItemLists([record(2)], [record(1), record(2)], "record_id");
    expect(statuses(result.currentWithRemoved)).toEqual([
      [1, "removed"],
      [2, null],
    ]);
  });

  it("records each item's position on both sides", () => {
    const result = compareItemLists([record(1), record(2)], [record(2), record(3)], "record_id");
    expect(result.current.map(({ position, otherPosition }) => [position, otherPosition])).toEqual([
      [1, null],
      [2, 1],
    ]);
    expect(result.compare.map(({ position, otherPosition }) => [position, otherPosition])).toEqual([
      [1, 2],
      [2, null],
    ]);
  });

  it("does not flag order changes for unordered lists", () => {
    const result = compareItemLists([record(1), record(2)], [record(2), record(1)], "record_id");
    expect(result.reorderedCount).toBe(0);
    expect(statuses(result.current)).toEqual([
      [1, null],
      [2, null],
    ]);
  });

  it("flags only the item that moved when one item is moved in an ordered list", () => {
    const current = [record(4), record(1), record(2), record(3)];
    const compare = [record(1), record(2), record(3), record(4)];
    const result = compareItemLists(current, compare, "record_id", true);

    expect(result.reorderedCount).toBe(1);
    expect(statuses(result.current)).toEqual([
      [4, "reordered"],
      [1, null],
      [2, null],
      [3, null],
    ]);
    expect(result.current[0].otherPosition).toBe(4);
    expect(statuses(result.compare)[3]).toEqual([4, "reordered"]);
  });

  it("flags one of two swapped items", () => {
    const result = compareItemLists([record(1), record(2)], [record(2), record(1)], "record_id", true);
    expect(result.reorderedCount).toBe(1);
    expect(result.current.filter(({ status }) => status === "reordered")).toHaveLength(1);
    expect(result.compare.filter(({ status }) => status === "reordered")).toHaveLength(1);
  });

  it("ignores added and removed items when comparing order", () => {
    const current = [record(9), record(1), record(2)];
    const compare = [record(1), record(8), record(2)];
    expect(compareItemLists(current, compare, "record_id", true).reorderedCount).toBe(0);
  });

  it("ignores current items flagged for deletion", () => {
    const result = compareItemLists([record(1), { ...record(2), delete: true }], [record(1), record(2)], "record_id");
    expect(result.onlyCurrent).toEqual([]);
    expect(result.onlyCompare).toEqual([record(2)]);
    expect(result.sharedCount).toBe(1);
    expect(result.current).toHaveLength(1);
  });

  it("handles missing lists", () => {
    expect(compareItemLists(undefined, null, "record_id", true)).toEqual({
      current: [],
      compare: [],
      currentWithRemoved: [],
      onlyCurrent: [],
      onlyCompare: [],
      sharedCount: 0,
      reorderedCount: 0,
    });
    expect(compareItemLists(null, [record(1)], "record_id").onlyCompare).toEqual([record(1)]);
  });

  it("uses the given id field", () => {
    const result = compareItemLists([{ collection_id: 1 }], [{ collection_id: 2 }], "collection_id");
    expect(result.onlyCurrent).toEqual([{ collection_id: 1 }]);
    expect(result.onlyCompare).toEqual([{ collection_id: 2 }]);
  });
});

describe("summarizeStatuses", () => {
  it("counts each status in a fixed order, ignoring unchanged items", () => {
    const statuses = ["removed", null, "added", "reordered", "added", null, "changed"];
    expect(summarizeStatuses(statuses)).toBe("2 added · 1 removed · 1 changed · 1 reordered");
  });

  it("uses the given status labels", () => {
    const labels = { added: "Only in this record", removed: "Only in the other record", changed: "Different" };
    expect(summarizeStatuses(["added", "removed", "removed"], labels)).toBe(
      "1 only in this record · 2 only in the other record",
    );
  });

  it("reports no differences when nothing changed", () => {
    expect(summarizeStatuses([null, null])).toBe("No differences");
    expect(summarizeStatuses([])).toBe("No differences");
  });
});

describe("getMediaPairs", () => {
  it("adds each pair's differing fields and status", () => {
    const current = [
      { media_id: 1, url: "a" },
      { media_id: 2, url: "same" },
      { media_id: 3, url: "c" },
    ];
    const compare = [
      { media_id: 1, url: "b" },
      { media_id: 2, url: "same" },
      { media_id: 4, url: "d" },
    ];
    const pairs = getMediaPairs(current, compare, getMediaComparison(current, compare));

    expect(pairs.map(({ mediaId, status }) => [mediaId, status])).toEqual([
      ["1", "changed"],
      ["2", null],
      ["3", "added"],
      ["4", "removed"],
    ]);
    expect(pairs[0].diffSpecs.map(({ path }) => path)).toEqual(["url"]);
    expect(pairs[1].diffSpecs).toEqual([]);
  });

  it("treats items restored into the current record as removed", () => {
    const current = [{ media_id: null, url: "b" }];
    const compare = [{ media_id: 5, url: "b" }];
    const [pair] = getMediaPairs(current, compare, { contentMatches: {}, diffs: {} }, ["5"]);
    expect(pair).toMatchObject({ mediaId: "5", isAdded: true, status: "removed" });
  });

  it("shows an item saved as new media with the same fields as its source as unchanged", () => {
    const current = [{ media_id: 9, record_id: 1, url: "a" }];
    const compare = [{ media_id: 5, record_id: 1, url: "a" }];
    const pairs = getMediaPairs(current, compare, getMediaComparison(current, compare));
    expect(pairs).toHaveLength(1);
    expect(pairs[0]).toMatchObject({ mediaId: "5", isMatched: true, isAdded: false, status: null });
    expect(pairs[0].current.media.media_id).toBe(9);
  });
});

describe("matchMediaByContent", () => {
  const cd = { call_number_item: { item: "CD", list_item_id: 1 }, call_number_suffix: "313" };

  it("matches items with different media_ids and the same compared fields", () => {
    // media_id, record_id and fields that aren't compared are ignored
    const current = [{ media_id: 9, record_id: 1, ...cd, extra: "x" }];
    const compare = [{ media_id: 5, record_id: 2, ...cd }];
    expect(matchMediaByContent(current, compare)).toEqual({ 9: 5 });
  });

  it("does not match items whose compared fields differ", () => {
    const current = [{ media_id: 9, ...cd }];
    const compare = [{ media_id: 5, ...cd, call_number_suffix: "314" }];
    expect(matchMediaByContent(current, compare)).toEqual({});
  });

  it("only matches items that aren't already matched by media_id, each at most once", () => {
    const current = [
      { media_id: 1, ...cd },
      { media_id: 8, ...cd },
      { media_id: 9, ...cd },
    ];
    const compare = [
      { media_id: 1, ...cd },
      { media_id: 5, ...cd },
    ];
    expect(matchMediaByContent(current, compare)).toEqual({ 8: 5 });
  });

  it("handles missing media lists", () => {
    expect(matchMediaByContent(undefined, null)).toEqual({});
  });
});

describe("insertAfterPredecessor", () => {
  const record = (record_id) => ({ record_id });
  const ids = (list) => list.map((item) => item.record_id);

  it("inserts the item after the nearest preceding comparison item still in the list", () => {
    const list = [record(1), record(4)];
    const compare = [record(1), record(2), record(3), record(4)];
    expect(ids(insertAfterPredecessor(list, compare, record(3), "record_id"))).toEqual([1, 3, 4]);
  });

  it("inserts at the start when no preceding comparison item is in the list", () => {
    expect(ids(insertAfterPredecessor([record(2)], [record(1), record(2)], record(1), "record_id"))).toEqual([1, 2]);
  });

  it("skips preceding items that are flagged for deletion", () => {
    const list = [record(1), { ...record(2), delete: true }, record(4)];
    const compare = [record(1), record(2), record(3), record(4)];
    expect(ids(insertAfterPredecessor(list, compare, record(3), "record_id"))).toEqual([1, 3, 2, 4]);
  });
});

describe("pairMediaItems", () => {
  it("pairs items by media_id regardless of position", () => {
    const current = [{ media_id: 1270 }, { media_id: 19188 }];
    const compare = [{ media_id: 19188 }, { media_id: 1270 }];
    const pairs = pairMediaItems(current, compare);

    expect(pairs).toHaveLength(2);
    expect(pairs[0]).toMatchObject({ mediaId: "1270", isMatched: true, isAdded: false });
    expect(pairs[0].current.index).toBe(0);
    expect(pairs[0].compare.index).toBe(1);
    expect(pairs[1].current.index).toBe(1);
    expect(pairs[1].compare.index).toBe(0);
  });

  it("keeps current-only items unmatched", () => {
    const [pair] = pairMediaItems([{ media_id: 1 }], []);
    expect(pair).toMatchObject({ mediaId: "1", compare: null, isMatched: false, isAdded: false });
  });

  it("appends compare-only items after the current items", () => {
    const pairs = pairMediaItems([{ media_id: 1 }], [{ media_id: 2 }, { media_id: 1 }]);
    expect(pairs.map(({ mediaId }) => mediaId)).toEqual(["1", "2"]);
    expect(pairs[1]).toMatchObject({ current: null, isMatched: false, isAdded: false });
    expect(pairs[1].compare.index).toBe(0);
  });

  it("matches restored items (null media_id) to their source in the order they were added", () => {
    const current = [{ media_id: 1 }, { media_id: null, url: "b" }, { media_id: null, url: "a" }];
    const compare = [{ media_id: 1 }, { media_id: 5, url: "a" }, { media_id: 6, url: "b" }];
    const pairs = pairMediaItems(current, compare, ["6", "5"]);

    expect(pairs).toHaveLength(3);
    expect(pairs[1]).toMatchObject({ mediaId: "6", isMatched: true, isAdded: true });
    expect(pairs[1].compare.media.url).toBe("b");
    expect(pairs[2]).toMatchObject({ mediaId: "5", isMatched: true, isAdded: true });
    expect(pairs[2].compare.media.url).toBe("a");
  });

  it("handles missing media lists", () => {
    expect(pairMediaItems(undefined, undefined)).toEqual([]);
  });
});

describe("getMediaComparison", () => {
  it("returns the differing paths for each matched item, keyed by media_id", () => {
    const current = [
      { media_id: 1, url: "a", format_item: { item: "CD", list_item_id: 10 } },
      { media_id: 2, url: "same" },
    ];
    const compare = [
      { media_id: 2, url: "same" },
      { media_id: 1, url: "b", format_item: { item: "Tape", list_item_id: 11 } },
    ];
    const { diffs } = getMediaComparison(current, compare);

    expect(diffs[1].has("url")).toBe(true);
    expect(diffs[1].has("format_item")).toBe(true);
    expect(diffs[2].size).toBe(0);
  });

  it("skips items that only exist on one side", () => {
    const { diffs } = getMediaComparison([{ media_id: 1, url: "a" }], [{ media_id: 2, url: "b" }]);
    expect(diffs).toEqual({});
  });

  it("keys the items matched by content by their comparison media_id", () => {
    const comparison = getMediaComparison([{ media_id: 9, url: "a" }], [{ media_id: 5, url: "a" }]);
    expect(comparison.contentMatches).toEqual({ 9: 5 });
    expect(Object.keys(comparison.diffs)).toEqual(["5"]);
  });

  it("handles missing media lists", () => {
    expect(getMediaComparison(undefined, null)).toEqual({ contentMatches: {}, diffs: {} });
  });
});
