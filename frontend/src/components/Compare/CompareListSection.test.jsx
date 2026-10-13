import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { FormProvider, useForm } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";

import CompareListSection from "./CompareListSection";

// The real lists pull in routing and thumbnails; only the item titles, markers and row actions matter here
vi.mock("src/components/EditableItemsList", () => {
  const List = ({ items }) => (
    <ul>
      {items.map((item) => (
        <li key={item.title} data-testid="item" data-highlight={item.highlight} data-muted={item.muted || undefined}>
          {item.marker}
          <span data-testid="title">{item.title}</span>
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

const clickButton = (element) => act(async () => fireEvent.click(element));
const row = (title) =>
  screen.getAllByTestId("item").find((item) => within(item).getByTestId("title").textContent === title);
// The undo tooltip label sits on a wrapper around the button
const undoButton = (container) => within(container).getByLabelText("Undo").querySelector("button");

// Each shown item's title, plus its status icon's label and highlight/muted flags in brackets
const shownItems = () =>
  screen.queryAllByTestId("item").map((item) => {
    const flags = [
      item.querySelector("svg[aria-label]")?.getAttribute("aria-label"),
      item.dataset.highlight,
      item.dataset.muted && "muted",
    ].filter(Boolean);
    const title = within(item).getByTestId("title").textContent;
    return flags.length ? `${title} [${flags.join(", ")}]` : title;
  });

describe("CompareListSection", () => {
  it("shows every item in one list, with the changes marked in place, when showing all fields", () => {
    renderSection({ current: [record(1), record(2)], compare: [record(2), record(3)], showOnlyDiffs: false });

    expect(screen.getByText("1 added · 1 removed")).toBeTruthy();
    expect(screen.getByText("Current version (2)")).toBeTruthy();
    expect(shownItems()).toEqual([
      "Record 1 [Added, info]",
      "Record 2",
      // The removed item, in its former place, greyed out
      "Record 3 [Removed, info, muted]",
    ]);
  });

  it("shows only the changed items when showing only differences", () => {
    renderSection({ current: [record(1), record(2)], compare: [record(2), record(3)], showOnlyDiffs: true });

    expect(shownItems()).toEqual(["Record 1 [Added, info]", "Record 3 [Removed, info, muted]"]);
  });

  it("is hidden when there are no differences and only differences are shown", () => {
    renderSection({ current: [record(1)], compare: [record(1)], showOnlyDiffs: true });
    expect(screen.queryByText("Records")).toBeNull();
  });

  it("shows the items without any buttons when there are no differences", () => {
    renderSection({ current: [record(1)], compare: [record(1)], showOnlyDiffs: false });
    expect(screen.getByText("No differences")).toBeTruthy();
    expect(shownItems()).toEqual(["Record 1"]);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("only treats a different order as a difference for ordered lists", () => {
    renderSection({ current: [record(1), record(2)], compare: [record(2), record(1)], showOnlyDiffs: true });
    expect(screen.queryByText("Records")).toBeNull();
  });

  it("marks reordered items with their positions on ordered lists", () => {
    renderSection({
      current: [record(3), record(1), record(2)],
      compare: [record(1), record(2), record(3)],
      showOnlyDiffs: true,
      ordered: true,
    });
    expect(screen.getByText("1 reordered")).toBeTruthy();
    expect(shownItems()).toEqual(["Record 3 [Reordered (#3 in comparison), info]"]);
    expect(row("Record 3").textContent).toContain("#1");
  });

  describe("restoring the whole list", () => {
    it("replaces the list with the comparison items and flags current-only items for deletion", async () => {
      const { getValues } = renderSection({ current: [record(1), record(2)], compare: [record(2), record(3)] });

      await clickButton(screen.getByRole("button", { name: /Restore all/ }));

      expect(getValues()).toEqual([record(2), record(3), { ...record(1), delete: true }]);
    });

    it("keeps showing the original changes, now marked as acted on, with the summary and undo", async () => {
      renderSection({ current: [record(1), record(2)], compare: [record(2), record(3)], showOnlyDiffs: true });

      await clickButton(screen.getByRole("button", { name: /Restore all/ }));

      expect(shownItems()).toEqual(["Record 1 [Added, success, muted]", "Record 3 [Removed, success]"]);
      expect(screen.getByText("1 added · 1 removed")).toBeTruthy();
      expect(screen.getByText(/restored from the comparison version/)).toBeTruthy();
    });

    it("restores the original list on undo", async () => {
      const { getValues } = renderSection({ current: [record(1), record(2)], compare: [record(2), record(3)] });
      const section = screen.getByText("Records").closest(".MuiPaper-root");

      await clickButton(screen.getByRole("button", { name: /Restore all/ }));
      // The section's undo comes first, before the rows' undo buttons
      await clickButton(within(section).getAllByLabelText("Undo")[0].querySelector("button"));

      expect(getValues()).toEqual([record(1), record(2)]);
      expect(screen.getByRole("button", { name: /Restore all/ })).toBeTruthy();
    });
  });

  describe("per-item actions", () => {
    it("restores a removed item into its former position, and undoes it", async () => {
      const { getValues } = renderSection({
        current: [record(1), record(3)],
        compare: [record(1), record(2), record(3)],
        ordered: true,
      });

      await clickButton(within(row("Record 2")).getByRole("button", { name: "Restore this item" }));
      expect(getValues()).toEqual([record(1), record(2), record(3)]);
      expect(shownItems()).toContain("Record 2 [Removed, success]");
      expect(screen.getByText(/unsaved changes|restored from the comparison version/)).toBeTruthy();

      await clickButton(undoButton(row("Record 2")));
      expect(getValues()).toEqual([record(1), record(3)]);
      expect(shownItems()).toContain("Record 2 [Removed, info, muted]");
    });

    it("flags an added item for deletion, and undoes it", async () => {
      const { getValues } = renderSection({ current: [record(1), record(2)], compare: [record(2)] });

      await clickButton(within(row("Record 1")).getByRole("button", { name: "Remove this item" }));
      expect(getValues()).toEqual([{ ...record(1), delete: true }, record(2)]);
      expect(shownItems()).toContain("Record 1 [Added, success, muted]");

      await clickButton(undoButton(row("Record 1")));
      expect(getValues()).toEqual([record(1), record(2)]);
      expect(shownItems()).toContain("Record 1 [Added, info]");
    });

    it("notes unsaved changes while the list still differs from the comparison version", async () => {
      renderSection({ current: [record(1), record(2)], compare: [record(2), record(3)] });

      await clickButton(within(row("Record 3")).getByRole("button", { name: "Restore this item" }));

      expect(screen.getByText(/unsaved changes/)).toBeTruthy();
    });
  });
});
