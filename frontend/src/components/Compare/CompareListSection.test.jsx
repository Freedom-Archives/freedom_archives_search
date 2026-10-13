import { act, fireEvent, render, screen } from "@testing-library/react";
import { FormProvider, useForm } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";

import CompareListSection from "./CompareListSection";

// The real lists pull in routing and thumbnails; only the item titles and their markers matter here
vi.mock("src/components/EditableItemsList", () => {
  const List = ({ items }) => (
    <ul>
      {items.map((item) => (
        <li key={item.title} data-testid="item" data-highlight={item.highlight} data-muted={item.muted || undefined}>
          {item.marker}
          {item.title}
          {item.action?.()}
        </li>
      ))}
    </ul>
  );
  return {
    RecordsList: ({ records }) => <List items={records} />,
    CollectionsList: ({ collections }) => <List items={collections} />,
  };
});

const record = (record_id) => ({ record_id, title: `Record ${record_id}` });

const renderSection = ({ current, compare, ...props }) => {
  let form;
  // The diff is recalculated whenever compareData changes, so it needs a stable identity (as it has in the app)
  const compareData = { child_records: compare };
  const Wrapper = () => {
    form = useForm({ defaultValues: { child_records: current } });
    return (
      <FormProvider {...form}>
        <CompareListSection name="child_records" label="Records" type="record" compareData={compareData} {...props} />
      </FormProvider>
    );
  };
  render(<Wrapper />);
  return { getValues: () => form.getValues("child_records") };
};

const click = (name) => act(async () => fireEvent.click(screen.getByRole("button", { name })));
// The undo tooltip label sits on a wrapper around the button
const clickUndo = () => act(async () => fireEvent.click(screen.getByLabelText("Undo").querySelector("button")));

describe("CompareListSection", () => {
  // Each shown item's text, plus its status icon's label and highlight/muted flags in brackets
  const shownItems = () =>
    screen.queryAllByTestId("item").map((item) => {
      const flags = [
        item.querySelector("svg[aria-label]")?.getAttribute("aria-label"),
        item.dataset.highlight,
        item.dataset.muted && "muted",
      ].filter(Boolean);
      return flags.length ? `${item.textContent} [${flags.join(", ")}]` : item.textContent;
    });

  it("shows every item, with all changes marked on the current side, when showing all fields", () => {
    renderSection({ current: [record(1), record(2)], compare: [record(2), record(3)], showOnlyDiffs: false });

    expect(screen.getByText("1 added · 1 removed")).toBeTruthy();
    expect(screen.getByText("Current version (2)")).toBeTruthy();
    expect(screen.getByText("Comparison version (2)")).toBeTruthy();
    expect(shownItems()).toEqual([
      // Current side, with the removed item in its former place, greyed out
      "Record 1 [Added, info]",
      "Record 2",
      "Record 3 [Removed, info, muted]",
      // Comparison side, unmarked
      "Record 2",
      "Record 3",
    ]);
  });

  it("shows only the changed items on each side when showing only differences", () => {
    renderSection({ current: [record(1), record(2)], compare: [record(2), record(3)], showOnlyDiffs: true });

    expect(screen.getByText("Current version (2)")).toBeTruthy();
    expect(shownItems()).toEqual(["Record 1 [Added, info]", "Record 3 [Removed, info, muted]", "Record 3"]);
  });

  it("is hidden when there are no differences and only differences are shown", () => {
    renderSection({ current: [record(1)], compare: [record(1)], showOnlyDiffs: true });
    expect(screen.queryByText("Records")).toBeNull();
  });

  it("shows the items without a Restore button when there are no differences", () => {
    renderSection({ current: [record(1)], compare: [record(1)], showOnlyDiffs: false });
    expect(screen.getByText("No differences")).toBeTruthy();
    expect(shownItems()).toEqual(["Record 1", "Record 1"]);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("only treats a different order as a difference for ordered lists", () => {
    renderSection({ current: [record(1), record(2)], compare: [record(2), record(1)], showOnlyDiffs: true });
    expect(screen.queryByText("Records")).toBeNull();
  });

  it("marks moved items with their positions on ordered lists", () => {
    renderSection({
      current: [record(3), record(1), record(2)],
      compare: [record(1), record(2), record(3)],
      showOnlyDiffs: true,
      ordered: true,
    });
    expect(screen.getByText("1 reordered")).toBeTruthy();
    expect(shownItems()).toEqual(["Record 3#1 [Reordered (#3 in comparison), info]", "Record 3#3"]);
  });

  it("restores the list with the comparison items and flags current-only items for deletion", async () => {
    const { getValues } = renderSection({ current: [record(1), record(2)], compare: [record(2), record(3)] });

    await click(/Restore/);

    expect(getValues()).toEqual([record(2), record(3), { ...record(1), delete: true }]);
  });

  it("shows the restored list in the columns, keeping the summary and undo", async () => {
    renderSection({ current: [record(1), record(2)], compare: [record(2), record(3)], showOnlyDiffs: true });

    await click(/Restore/);

    // The lists now match, so both are shown in full, unmarked
    expect(shownItems()).toEqual(["Record 2", "Record 3", "Record 2", "Record 3"]);
    expect(screen.getByText("1 added · 1 removed")).toBeTruthy();
    expect(screen.getByText(/restored from the comparison version/)).toBeTruthy();
    expect(screen.getByLabelText("Undo")).toBeTruthy();
  });

  it("restores the original list on undo", async () => {
    const { getValues } = renderSection({ current: [record(1), record(2)], compare: [record(2), record(3)] });

    await click(/Restore/);
    await clickUndo();

    expect(getValues()).toEqual([record(1), record(2)]);
    expect(screen.getByRole("button", { name: /Restore/ })).toBeTruthy();
    expect(shownItems()).toEqual([
      "Record 1 [Added, info]",
      "Record 2",
      "Record 3 [Removed, info, muted]",
      "Record 2",
      "Record 3",
    ]);
  });
});
