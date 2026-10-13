import { Box, Grid } from "@mui/material";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Children } from "react";

import { MEDIA_FIELD_SPECS } from "./compareConfig";
import { StatusIcon } from "./CompareItemList";

// Label/value pairs describing a media item, e.g. [["Primary"], ["Call Number", "CD 123"], ["Format", "CD"]]
const summarizeMedia = (media) =>
  MEDIA_FIELD_SPECS.map(({ path, label, field_type }) => {
    let value = field_type === "list_item" ? media[path]?.item : media[path];
    if (path === "call_number_item" && value) {
      value = [value, media["call_number_suffix"]].filter(Boolean).join(" ");
    } else if (path === "call_number_suffix") {
      return null;
    }
    if (field_type === "checkbox") {
      return value ? [label] : null;
    }
    return value == null || value === "" ? null : [label, value];
  }).filter(Boolean);

// Textual representation of a media item, with muted labels and emphasized values
const MediaSummary = ({ media }) => (
  <Stack direction="row" flexWrap="wrap" columnGap={2} rowGap={0.5} alignItems="center">
    {summarizeMedia(media).map(([label, value]) => (
      <Typography key={label} variant="subtitle2" sx={{ overflowWrap: "anywhere" }}>
        {value === undefined ? (
          label
        ) : (
          <>
            <Typography component="span" variant="subtitle1" color="text.secondary">
              {label}:
            </Typography>{" "}
            {value}
          </>
        )}
      </Typography>
    ))}
  </Stack>
);

// One compared media item: a summary of the item (media items have no title), a note (e.g. "to be deleted"), any
// actions, and the compared field rows (children)
//   status: added, removed or changed, shown as an icon and highlight, as in the compared lists
//   statusLabels: a STATUS_LABELS set, for the status icon's tooltip
//   highlight: palette color for the highlight, overriding the status's ("success" once the user has acted on it)
//   muted: fades the item, e.g. when it is flagged for removal
const CompareMediaCard = ({ media, note, status, statusLabels, highlight, actions, muted = false, children }) => {
  const color = highlight ?? (status ? "info" : null);
  // Matches the fading of muted rows in the compared lists
  const opacity = muted ? 0.4 : 1;
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        ...(color && {
          backgroundColor: `rgba(var(--mui-palette-${color}-lightChannel) / 0.1)`,
          borderColor: `var(--mui-palette-${color}-main)`,
        }),
      }}
    >
      <Stack spacing={1}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
          <Stack direction="row" spacing={1} alignItems="center">
            {status && <StatusIcon status={status} labels={statusLabels} />}
            <Box sx={{ opacity }}>
              <MediaSummary media={media} />
            </Box>
            {note && (
              <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
                ({note})
              </Typography>
            )}
          </Stack>
          {actions}
        </Stack>
        {Children.toArray(children).length > 0 && (
          <Grid container sx={{ alignItems: "start", opacity }} size={12}>
            {children}
          </Grid>
        )}
      </Stack>
    </Paper>
  );
};

export default CompareMediaCard;
