import AddCircleOutline from "@mui/icons-material/AddCircleOutline";
import KeyboardDoubleArrowLeft from "@mui/icons-material/KeyboardDoubleArrowLeft";
import RemoveCircleOutline from "@mui/icons-material/RemoveCircleOutline";
import SwapVert from "@mui/icons-material/SwapVert";
import { Box, Grid, Tooltip, Typography } from "@mui/material";
import { get } from "lodash-es";
import { useEffect, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { CollectionsList, RecordsList } from "src/components/EditableItemsList";

import { FormSection, UndoableActionButton } from "./CompareSharedComponents";
import { compareItemLists } from "./CompareUtils";

// Each column scrolls past this height
const LIST_MAX_HEIGHT = 400;

const STATUS_ICONS = {
  added: { Icon: AddCircleOutline, color: "success", tooltip: () => "Added" },
  removed: { Icon: RemoveCircleOutline, color: "error", tooltip: () => "Removed" },
  reordered: {
    Icon: SwapVert,
    color: "warning",
    tooltip: (otherPosition) => `Reordered (#${otherPosition} in comparison)`,
  },
};

// Status icon, shown under the item's thumbnail
const StatusIcon = ({ status, otherPosition }) => {
  const { Icon, color, tooltip } = STATUS_ICONS[status];
  return (
    <Tooltip title={tooltip(otherPosition)}>
      <Icon fontSize="small" color={color} aria-label={tooltip(otherPosition)} />
    </Tooltip>
  );
};

// Compares a list of related items (e.g. a collection's records) as a whole: shows each side's items, with the
// added, removed and moved items marked on the current side, and lets the entire list be restored from the
// comparison version
const CompareListSection = ({ name, label, type, ordered = false, compareData, showOnlyDiffs }) => {
  const { getValues, setValue, formState } = useFormContext();
  const currentList = useWatch({ name });
  const [diff, setDiff] = useState(null);
  const idField = `${type}_id`;

  // Calculate the original diff once per comparison, so the section, its summary and the Restore/undo button stay
  // stable when the list is restored
  useEffect(() => {
    setDiff(compareItemLists(getValues(name), compareData?.[name], idField, ordered));
  }, [compareData, name, idField, ordered, getValues]);

  if (!diff) {
    return null;
  }

  const { onlyCurrent, onlyCompare, reorderedCount } = diff;
  const hasDiff = onlyCurrent.length > 0 || onlyCompare.length > 0 || reorderedCount > 0;
  if (showOnlyDiffs && !hasDiff) {
    return null;
  }

  // The columns show the list as it is now, so they reflect a Restore
  const isDirty = !!get(formState.dirtyFields, name);
  const liveDiff = compareItemLists(currentList, compareData?.[name], idField, ordered);
  const liveHasDiff = liveDiff.onlyCurrent.length > 0 || liveDiff.onlyCompare.length > 0 || liveDiff.reorderedCount > 0;
  // Once the lists match (e.g. after a Restore), show them in full rather than empty columns
  const showAllItems = !showOnlyDiffs || !liveHasDiff;

  // Items are removed on save by flagging them, so keep the current-only items in the list, marked for deletion
  const handleReplace = () => {
    const replaced = [...(compareData?.[name] || []), ...onlyCurrent.map((item) => ({ ...item, delete: true }))];
    setValue(name, replaced, { shouldValidate: true, shouldDirty: true });
  };

  // resetField only works on registered inputs, so restore the loaded value directly
  const handleUndo = () => {
    setValue(name, get(formState.defaultValues, name), { shouldValidate: true, shouldDirty: true });
  };

  const summary = [
    onlyCurrent.length && `${onlyCurrent.length} added`,
    onlyCompare.length && `${onlyCompare.length} removed`,
    reorderedCount && `${reorderedCount} reordered`,
  ].filter(Boolean);

  const ItemsList = type === "record" ? RecordsList : CollectionsList;
  // The current side shows every change, including the removed items in their former place, marked with icons
  const columns = [
    {
      title: "Current version",
      count: liveDiff.current.length,
      entries: liveDiff.currentWithRemoved,
      showStatus: true,
    },
    { title: "Comparison version", count: liveDiff.compare.length, entries: liveDiff.compare, showStatus: false },
  ];

  return (
    <FormSection
      title={label}
      sectionActions={
        hasDiff && (
          <UndoableActionButton
            isDirty={isDirty}
            tooltip={`Restore the ${label.toLowerCase()} from the right column`}
            onCopy={handleReplace}
            onRestore={handleUndo}
            size="small"
          >
            <KeyboardDoubleArrowLeft />
            Restore
          </UndoableActionButton>
        )
      }
    >
      <Typography variant="body2" color="text.secondary">
        {hasDiff ? summary.join(" · ") : "No differences"}
        {isDirty && !liveHasDiff && (
          <Typography component="span" variant="body2" color="success.main">
            {" "}
            · restored from the comparison version
          </Typography>
        )}
      </Typography>
      <Grid container spacing={2}>
        {columns.map(({ title, count, entries, showStatus }) => {
          const shown = showAllItems ? entries : entries.filter(({ status }) => status);
          const items = shown.map(({ item, position, otherPosition, status }) => {
            const marked = showStatus && status;
            return {
              ...item,
              // On the current side, changed items get a status icon and the changed-field highlight, and removed
              // items are greyed out
              marker: marked && <StatusIcon status={status} otherPosition={otherPosition} />,
              highlight: marked ? "info" : undefined,
              muted: marked && status === "removed",
              action:
                ordered && position
                  ? () => (
                      <Typography variant="caption" color="text.secondary">
                        #{position}
                      </Typography>
                    )
                  : undefined,
            };
          });
          return (
            <Grid key={title} size={6}>
              <Typography variant="subtitle2">
                {title} ({count})
              </Typography>
              {/* Long lists (a collection can have hundreds of records) scroll within the section */}
              <Box sx={{ maxHeight: LIST_MAX_HEIGHT, overflowY: "auto", px: 0.5 }}>
                <ItemsList {...{ [`${type}s`]: items }} emptyText="None" dense />
              </Box>
            </Grid>
          );
        })}
      </Grid>
    </FormSection>
  );
};

export default CompareListSection;
