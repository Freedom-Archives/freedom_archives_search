import { get, omit } from "lodash-es";
import { useEffect, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import CompareItemList from "./CompareItemList";
import { CompareChangesSection, ItemActionButton } from "./CompareSharedComponents";
import { compareItemLists, insertAfterPredecessor, summarizeStatuses } from "./CompareUtils";

// Compares a list of related items (e.g. a collection's records) in the form with the comparison version. Removed
// items can be restored and added items removed one at a time, or the entire list restored from the comparison
// version.
const CompareListSection = ({ name, label, type, ordered = false, compareData, showOnlyDiffs }) => {
  const { getValues, setValue, formState } = useFormContext();
  const currentList = useWatch({ name });
  const [diff, setDiff] = useState(null);
  const idField = `${type}_id`;

  // Calculate the original diff once per comparison. The list shows the original changes, so each row keeps its
  // status and action (and undo) as items are restored or removed.
  useEffect(() => {
    setDiff(compareItemLists(getValues(name), compareData?.[name], idField, ordered));
  }, [compareData, name, idField, ordered, getValues]);

  if (!diff) {
    return null;
  }

  const statuses = diff.currentWithRemoved.map(({ status }) => status);
  const hasDiff = statuses.some(Boolean);
  if (showOnlyDiffs && !hasDiff) {
    return null;
  }

  const list = currentList || [];
  const compareList = compareData?.[name] || [];
  const isDirty = !!get(formState.dirtyFields, name);
  const liveDiff = compareItemLists(list, compareList, idField, ordered);
  const setList = (value) => setValue(name, value, { shouldValidate: true, shouldDirty: true });
  const liveItems = new Map(list.map((item) => [item[idField], item]));

  // Items are removed on save by flagging them, so keep the current-only items in the list, marked for deletion
  const handleRestoreAll = () => {
    setList([...compareList, ...diff.onlyCurrent.map((item) => ({ ...item, delete: true }))]);
  };

  // resetField only works on registered inputs, so restore the loaded value directly
  const handleUndoAll = () => {
    setList(get(formState.defaultValues, name));
  };

  const restoreItem = (item) => setList(insertAfterPredecessor(list, compareList, item, idField));
  const undoRestoreItem = (id) => setList(list.filter((item) => item[idField] !== id));
  const removeItem = (id) => setList(list.map((item) => (item[idField] === id ? { ...item, delete: true } : item)));
  const undoRemoveItem = (id) => setList(list.map((item) => (item[idField] === id ? omit(item, "delete") : item)));

  // Rows the user has acted on are highlighted as changed, like edited fields
  const entries = diff.currentWithRemoved.map((entry) => {
    const id = entry.item[idField];
    const liveItem = liveItems.get(id);
    if (entry.status === "removed") {
      const restored = !!liveItem && !liveItem.delete;
      return {
        ...entry,
        muted: !restored,
        highlight: restored ? "success" : "info",
        rowAction: (
          <ItemActionButton
            action="restore"
            isDirty={restored}
            tooltip="Restore this item"
            onAction={() => restoreItem(entry.item)}
            onUndo={() => undoRestoreItem(id)}
          />
        ),
      };
    }
    if (entry.status === "added") {
      const removed = !!liveItem?.delete;
      return {
        ...entry,
        muted: removed,
        highlight: removed ? "success" : "info",
        rowAction: (
          <ItemActionButton
            action="remove"
            isDirty={removed}
            tooltip="Remove this item"
            onAction={() => removeItem(id)}
            onUndo={() => undoRemoveItem(id)}
          />
        ),
      };
    }
    return entry;
  });

  return (
    <CompareChangesSection
      title={label}
      summary={summarizeStatuses(statuses)}
      note={
        isDirty &&
        (liveDiff.currentWithRemoved.some(({ status }) => status)
          ? "unsaved changes"
          : "restored from the comparison version")
      }
      restoreAll={
        hasDiff && {
          isDirty,
          tooltip: `Restore all ${label.toLowerCase()} from the comparison version`,
          onAction: handleRestoreAll,
          onUndo: handleUndoAll,
        }
      }
    >
      <CompareItemList
        entries={entries}
        type={type}
        ordered={ordered}
        showAll={!showOnlyDiffs}
        title="Current version"
        count={liveDiff.current.length}
      />
    </CompareChangesSection>
  );
};

export default CompareListSection;
