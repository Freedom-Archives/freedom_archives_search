import dayjs from "dayjs";
import { describe, expect, it } from "vitest";

import { compareItemLists, compareObjects, getMediaDiffs, pairMediaItems } from "./CompareUtils";

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

describe("getMediaDiffs", () => {
  it("returns the differing paths for each matched item, keyed by media_id", () => {
    const current = [
      { media_id: 1, url: "a", format_item: { item: "CD", list_item_id: 10 } },
      { media_id: 2, url: "same" },
    ];
    const compare = [
      { media_id: 2, url: "same" },
      { media_id: 1, url: "b", format_item: { item: "Tape", list_item_id: 11 } },
    ];
    const diffs = getMediaDiffs(current, compare);

    expect(diffs[1].has("url")).toBe(true);
    expect(diffs[1].has("format_item")).toBe(true);
    expect(diffs[2].size).toBe(0);
  });

  it("skips items that only exist on one side", () => {
    const diffs = getMediaDiffs([{ media_id: 1 }], [{ media_id: 2 }]);
    expect(diffs).toEqual({});
  });

  it("handles missing media lists", () => {
    expect(getMediaDiffs(undefined, null)).toEqual({});
  });
});
