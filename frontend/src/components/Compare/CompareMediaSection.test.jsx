import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { FormManagerContext } from "src/components/form/FormManagerContext";
import { describe, expect, it, vi } from "vitest";

import CompareMediaSection from "./CompareMediaSection";

// The status icon's module pulls in the related item lists, which need routing and thumbnails
vi.mock("src/components/EditableItemsList", () => ({ RecordsList: () => null, CollectionsList: () => null }));
// The compared fields are real form fields (with list lookups); only the media values the actions save matter here
vi.mock("src/components/Compare/CompareSharedComponents", async (importOriginal) => ({
  ...(await importOriginal()),
  CompareField: () => null,
}));

const media = (media_id, url, record_id = 1) => ({ media_id, record_id, url, no_copies: 1 });

const renderSection = ({ current, compare, ...props }) => {
  let form;
  // The comparison is calculated whenever compareData changes, so it needs a stable identity (as it has in the app)
  const compareData = { media: compare };
  const Wrapper = () => {
    form = useForm({ defaultValues: { media: current } });
    return (
      <FormManagerContext.Provider value={{ formContext: form }}>
        <CompareMediaSection compareData={compareData} versions {...props} />
      </FormManagerContext.Provider>
    );
  };
  render(<Wrapper />);
  return { getValues: () => form.getValues("media") };
};

const clickButton = (element) => act(async () => fireEvent.click(element));
// Clicks the named button, returning the media card it's in
const clickItemButton = async (name) => {
  const button = screen.getByRole("button", { name });
  const card = button.closest(".MuiPaper-root");
  await clickButton(button);
  return card;
};
// The undo tooltip label sits on a wrapper around the button
const clickUndo = (container) => clickButton(within(container).getByLabelText("Undo").querySelector("button"));

describe("CompareMediaSection", () => {
  describe("per-item actions", () => {
    it("restores a changed item from the comparison version, and undoes it", async () => {
      const { getValues } = renderSection({ current: [media(1, "new")], compare: [media(1, "old")] });

      const card = await clickItemButton("Restore this item from the comparison version");
      expect(getValues()).toEqual([media(1, "old")]);

      await clickUndo(card);
      expect(getValues()).toEqual([media(1, "new")]);
    });

    it("flags an added item for deletion, and undoes it", async () => {
      const { getValues } = renderSection({ current: [media(1, "a"), media(2, "b")], compare: [media(1, "a")] });

      const card = await clickItemButton("Remove this media item");
      expect(getValues()).toEqual([media(1, "a"), { ...media(2, "b"), delete: true }]);
      expect(within(card).getByText("(to be deleted)")).toBeTruthy();

      await clickUndo(card);
      expect(getValues()).toEqual([media(1, "a"), media(2, "b")]);
    });

    it("restores a removed item as new media on this record, and undoes it", async () => {
      const { getValues } = renderSection({ current: [media(1, "a")], compare: [media(1, "a"), media(2, "b")] });

      const card = await clickItemButton("Restore this media item from the comparison version");
      // Without ids, the item is created as new media on this record when saved
      expect(getValues()).toEqual([media(1, "a"), media(null, "b", null)]);
      expect(within(card).getByText("(restored)")).toBeTruthy();

      await clickUndo(card);
      expect(getValues()).toEqual([media(1, "a")]);
    });
  });

  describe("restoring all the media", () => {
    const current = [media(1, "new"), media(2, "added")];
    const compare = [media(1, "old"), media(3, "removed")];

    it("restores changed items, flags added items for deletion and restores removed items as new media", async () => {
      const { getValues } = renderSection({ current, compare });

      await clickButton(screen.getByRole("button", { name: /Restore all/ }));

      expect(getValues()).toEqual([
        media(1, "old"),
        { ...media(2, "added"), delete: true },
        media(null, "removed", null),
      ]);
      expect(screen.getByText(/unsaved changes/)).toBeTruthy();
    });

    it("restores the original media on undo", async () => {
      const { getValues } = renderSection({ current, compare });
      const section = screen.getByText("Media").closest(".MuiPaper-root");

      await clickButton(screen.getByRole("button", { name: /Restore all/ }));
      // The section's undo comes first, before the items' undo buttons
      await clickButton(within(section).getAllByLabelText("Undo")[0].querySelector("button"));

      expect(getValues()).toEqual(current);
    });
  });

  describe("comparing with another record", () => {
    it("copies an item from the other record as new media on this record, without a Restore all", async () => {
      const { getValues } = renderSection({
        current: [media(1, "a")],
        compare: [media(2, "b", 99)],
        versions: false,
      });

      expect(screen.queryByRole("button", { name: /Restore all/ })).toBeNull();
      const card = await clickItemButton("Copy this media item from the other record");
      expect(getValues()).toEqual([media(1, "a"), media(null, "b", null)]);
      expect(within(card).getByText("(copied)")).toBeTruthy();
    });
  });

  it("treats an item saved as new media with the same fields as its source as unchanged", () => {
    renderSection({ current: [media(9, "a")], compare: [media(5, "a")], showOnlyDiffs: true });
    expect(screen.queryByText("Media")).toBeNull();
  });
});
