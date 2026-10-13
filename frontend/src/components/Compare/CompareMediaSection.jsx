import KeyboardDoubleArrowLeft from "@mui/icons-material/KeyboardDoubleArrowLeft";
import { Box, Grid, Icon } from "@mui/material";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";
import { useWatch } from "react-hook-form";
import { CompareField, UndoableActionButton } from "src/components/Compare/CompareSharedComponents";
import { getMediaDiffs, pairMediaItems } from "src/components/Compare/CompareUtils";
import useFormManagerContext from "src/components/form/FormManagerContext";

const MEDIA_FIELD_SPECS = [
  // { path: "media_id" },
  { path: "is_primary", label: "Primary", field_type: "checkbox" },
  { path: "call_number_item", label: "Call Number", field_type: "list_item", itemType: "call_number", fetchAll: true },
  { path: "call_number_suffix", label: "Suffix" },
  { path: "generation_item", label: "Generation", field_type: "list_item", itemType: "generation", fetchAll: true },
  { path: "format_item", label: "Format", field_type: "list_item", itemType: "format", fetchAll: true },
  { path: "quality_item", label: "Quality", field_type: "list_item", itemType: "quality", fetchAll: true },
  { path: "no_copies", label: "Copies", type: "number" },
  { path: "url", label: "URL" },
];

const NO_DIFFS = new Set();

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

// versions: comparing with a saved version, so whole items are "restored" rather than "replaced"
const CompareMediaSection = ({
  compareData,
  compareFormMethods,
  showOnlyDiffs,
  groupIndex = 0,
  copyTooltip,
  versions = false,
}) => {
  const {
    formContext: { control, getValues, setValue },
  } = useFormManagerContext();
  const currentMedia = useWatch({ control, name: "media" });
  const [mediaDiffs, setMediaDiffs] = useState({}); // mediaId -> Set of differing paths
  const [mediaChanges, setMediaChanges] = useState({}); // mediaId -> original item, before Replace
  // Comparison media_ids of the items restored into the current record, in the order they were added
  const [addedMediaIds, setAddedMediaIds] = useState([]);

  // Calculate diffs once per comparison record, so they stay stable as fields are copied
  useEffect(() => {
    setMediaDiffs(getMediaDiffs(getValues("media"), compareData?.media));
  }, [compareData, getValues]);

  const allPairs = pairMediaItems(currentMedia, compareData?.media, addedMediaIds);

  const setMedia = (media) => setValue("media", media, { shouldValidate: true, shouldDirty: true });

  const replaceMediaItem = (index, item) => {
    setMedia(getValues("media").map((m, idx) => (idx === index ? item : m)));
  };

  const handleReplaceMedia = (mediaId, { media, index }, compareItem) => {
    replaceMediaItem(index, { ...compareItem });
    setMediaChanges((prev) => ({ ...prev, [mediaId]: media }));
  };

  const handleUndoReplaceMedia = (mediaId, { index }) => {
    replaceMediaItem(index, mediaChanges[mediaId]);
    setMediaChanges(({ [mediaId]: _restored, ...rest }) => rest);
  };

  // Flag the item for deletion when the record is saved
  const handleRemoveMedia = ({ media, index }) => {
    replaceMediaItem(index, { ...media, delete: true });
  };

  const handleUndoRemoveMedia = ({ media: { delete: _delete, ...media }, index }) => {
    replaceMediaItem(index, media);
  };

  const handleAddMedia = (mediaId, compareItem) => {
    // Clear the ids so the item is created as new media on the current record when saved
    setMedia([...(getValues("media") || []), { ...compareItem, media_id: null, record_id: null }]);
    setAddedMediaIds((prev) => [...prev, mediaId]);
  };

  const handleUndoAddMedia = (mediaId, { index }) => {
    setMedia(getValues("media").filter((_, idx) => idx !== index));
    setAddedMediaIds((prev) => prev.filter((id) => id !== mediaId));
  };

  return (
    <Stack direction="column" spacing={3}>
      {allPairs.map((pair, itemNum) => {
        const { mediaId, current, compare, isMatched, isAdded } = pair;
        const isRemoved = !!current?.media.delete;
        const itemDiffs = mediaDiffs[mediaId] ?? NO_DIFFS;
        const diffSpecs = MEDIA_FIELD_SPECS.filter(({ path }) => itemDiffs.has(path));
        const isUnchanged = isMatched && !isAdded && !diffSpecs.length;
        const fieldSpecs = showOnlyDiffs ? diffSpecs : MEDIA_FIELD_SPECS;

        return (
          <Paper key={mediaId} variant="outlined" sx={{ p: 2 }}>
            <Stack spacing={1}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle2" sx={{ fontWeight: 600, opacity: isRemoved ? 0.3 : 1 }}>
                  Media Item {itemNum + 1} ({mediaId}){isRemoved && " (removed)"}
                  {isAdded && " (added)"}
                  {isUnchanged && " (no differences)"}
                </Typography>
                {isMatched && !isAdded && !isUnchanged && (
                  <UndoableActionButton
                    isDirty={!!mediaChanges[mediaId]}
                    tooltip={
                      versions
                        ? "Restore this item from the comparison version"
                        : "Replace current item with comparison version"
                    }
                    onCopy={() => handleReplaceMedia(mediaId, current, compare.media)}
                    onRestore={() => handleUndoReplaceMedia(mediaId, current)}
                    size="small"
                  >
                    <KeyboardDoubleArrowLeft />
                    {versions ? "Restore" : "Replace"}
                  </UndoableActionButton>
                )}
                {current && !isMatched && (
                  <UndoableActionButton
                    isDirty={isRemoved}
                    tooltip="Remove this media item"
                    onCopy={() => handleRemoveMedia(current)}
                    onRestore={() => handleUndoRemoveMedia(current)}
                    size="small"
                  >
                    <Icon>delete</Icon>
                    Remove
                  </UndoableActionButton>
                )}
                {/* Once added, the item is matched on both sides, so keep showing its undo */}
                {(isAdded || !current) && (
                  <UndoableActionButton
                    isDirty={isAdded}
                    tooltip="Restore this media item from comparison"
                    onCopy={() => handleAddMedia(mediaId, compare.media)}
                    onRestore={() => handleUndoAddMedia(mediaId, current)}
                    size="small"
                  >
                    <Icon>add</Icon>
                    Restore
                  </UndoableActionButton>
                )}
              </Stack>
              <Box sx={{ opacity: isRemoved ? 0.3 : 1 }}>
                <MediaSummary media={(current ?? compare).media} />
              </Box>
              {fieldSpecs.length > 0 && (
                <Grid container sx={{ alignItems: "start", opacity: isRemoved ? 0.3 : 1 }} size={12}>
                  {fieldSpecs.map(({ path, ...options }, index) => (
                    <CompareField
                      key={path}
                      name={current ? `media.${current.index}.${path}` : null}
                      compareName={compare ? `media.${compare.index}.${path}` : null}
                      options={options}
                      index={index}
                      groupIndex={groupIndex + itemNum}
                      hasDiff={itemDiffs.has(path)}
                      disabled={isRemoved}
                      compareFormMethods={compareFormMethods}
                      tooltip={copyTooltip}
                    />
                  ))}
                </Grid>
              )}
            </Stack>
          </Paper>
        );
      })}
    </Stack>
  );
};

export default CompareMediaSection;
