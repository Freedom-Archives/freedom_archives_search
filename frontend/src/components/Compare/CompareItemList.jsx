import AddCircleOutline from "@mui/icons-material/AddCircleOutline";
import EditOutlined from "@mui/icons-material/EditOutlined";
import RemoveCircleOutline from "@mui/icons-material/RemoveCircleOutline";
import SwapVert from "@mui/icons-material/SwapVert";
import { Box, Stack, Tooltip, Typography } from "@mui/material";
import { CollectionsList, RecordsList } from "src/components/EditableItemsList";

import { STATUS_LABELS } from "./compareConfig";

// The list scrolls past this height
const LIST_MAX_HEIGHT = 400;

const STATUS_ICONS = {
  added: { Icon: AddCircleOutline, color: "success" },
  removed: { Icon: RemoveCircleOutline, color: "error" },
  changed: { Icon: EditOutlined, color: "info" },
  reordered: { Icon: SwapVert, color: "warning" },
};

// Icon for a compared item's status: added, removed, changed or reordered
//   labels: a STATUS_LABELS set, for the tooltip
export const StatusIcon = ({ status, otherPosition, labels = STATUS_LABELS.versions }) => {
  const { Icon, color } = STATUS_ICONS[status];
  const tooltip = status === "reordered" ? `${labels.reordered} (#${otherPosition} in comparison)` : labels[status];
  return (
    <Tooltip title={tooltip}>
      <Icon fontSize="small" color={color} aria-label={tooltip} />
    </Tooltip>
  );
};

// A compared list of related items (records or collections), as one list showing every change in place: added and
// reordered items, and removed items in their former position. Changed items are marked with a status icon and
// highlighted, and removed items are greyed out.
//   entries: [{ item, position, otherPosition, status }], e.g. a compareItemLists result's currentWithRemoved. An
//     entry can also set rowAction (shown at the end of its row), muted and highlight (a palette color).
//   showAll: show the unchanged items too
const CompareItemList = ({ entries, type, ordered = false, showAll, title, count }) => {
  const ItemsList = type === "record" ? RecordsList : CollectionsList;
  const shown = showAll ? entries : entries.filter(({ status }) => status);
  // If any row has an action, every row reserves space for one, so the positions line up
  const hasActions = shown.some(({ rowAction }) => rowAction);
  const items = shown.map(({ item, position, otherPosition, status, rowAction, muted, highlight }) => {
    const positionLabel = ordered && position && (
      <Typography variant="caption" color="text.secondary">
        #{position}
      </Typography>
    );
    return {
      ...item,
      // Unchanged rows get an empty marker, so their thumbnails line up with the changed rows'
      marker: status ? <StatusIcon status={status} otherPosition={otherPosition} /> : null,
      highlight: highlight ?? (status ? "info" : undefined),
      muted: muted ?? status === "removed",
      action:
        positionLabel || hasActions
          ? () => (
              <Stack direction="row" spacing={1} alignItems="center">
                {positionLabel}
                {hasActions && (
                  <Box sx={{ minWidth: 64, display: "flex", justifyContent: "flex-end" }}>{rowAction}</Box>
                )}
              </Stack>
            )
          : undefined,
    };
  });

  return (
    <Box>
      <Typography variant="subtitle2">
        {title} ({count})
      </Typography>
      {/* Long lists (a collection can have hundreds of records) scroll within the section */}
      <Box sx={{ maxHeight: LIST_MAX_HEIGHT, overflowY: "auto", px: 0.5 }}>
        <ItemsList {...{ [`${type}s`]: items }} emptyText="None" dense />
      </Box>
    </Box>
  );
};

export default CompareItemList;
