import Add from "@mui/icons-material/Add";
import KeyboardDoubleArrowLeft from "@mui/icons-material/KeyboardDoubleArrowLeft";
import Replay from "@mui/icons-material/Replay";
import { Box, Icon } from "@mui/material";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { FormProvider, useFormContext } from "react-hook-form";
import { Field } from "src/components/form/Field";

const UndoableActionButton = ({ isDirty, hasDiff, tooltip, onCopy, onRestore, children, size = "medium" }) => {
  return isDirty ? (
    <Tooltip title="Undo">
      <span>
        <Button size={size} variant="outlined" onClick={onRestore} disabled={!hasDiff}>
          <Replay sx={{ fontSize: size === "small" ? "1.2rem" : "1.5rem" }} />
        </Button>
      </span>
    </Tooltip>
  ) : (
    <Tooltip title={tooltip}>
      <Button size={size} variant="outlined" onClick={onCopy}>
        {children}
      </Button>
    </Tooltip>
  );
};

const MEDIA_FIELD_SPECS = [
  { path: "media_id" },
  { path: "is_primary", label: "Primary", field_type: "checkbox" },
  { path: "call_number_item", label: "Call Number", field_type: "list_item", itemType: "call_number", fetchAll: true },
  { path: "call_number_suffix", label: "Suffix" },
  { path: "generation_item", label: "Generation", field_type: "list_item", itemType: "generation", fetchAll: true },
  { path: "format_item", label: "Format", field_type: "list_item", itemType: "format", fetchAll: true },
  { path: "quality_item", label: "Quality", field_type: "list_item", itemType: "quality", fetchAll: true },
  { path: "no_copies", label: "Copies", type: "number" },
  { path: "url", label: "URL" },
];

const MediaFieldCompare = ({
  spec,
  index,
  compareIndex,
  onCopyMedia,
  compareFormMethods,
  hasCurrentMedia,
  hasCompareMedia,
  diffFields,
}) => {
  const { getValues: getCurrentValues } = useFormContext();
  const { getValues: getCompareValues } = compareFormMethods;
  const fieldName = `media.${index}.${spec.path}`;
  const hasDiff = diffFields.has(fieldName);

  return (
    <Stack spacing={1}>
      <Stack spacing={1} direction="row" alignItems="start">
        <Box sx={{ visibility: !hasCurrentMedia ? "hidden" : "visible", flex: 1 }}>
          {hasCurrentMedia && (
            <Field
              highlightDirty={true}
              disabled={false}
              name={fieldName}
              label={spec.label}
              {...spec}
              color={hasDiff ? "info" : null}
            />
          )}
        </Box>
        <Box sx={{ pt: 1 }}>
          <UndoableActionButton
            isDirty={false}
            hasDiff={hasDiff}
            tooltip="Copy from comparison record"
            onCopy={() => onCopyMedia(index)}
            onRestore={() => {}}
            size="small"
          >
            <KeyboardDoubleArrowLeft sx={{ fontSize: "small" }} />
          </UndoableActionButton>
        </Box>
        <FormProvider {...compareFormMethods}>
          <Box sx={{ visibility: !hasCompareMedia ? "hidden" : "visible", flex: 1 }}>
            {hasCompareMedia && compareIndex !== undefined && (
              <Field disabled={true} name={`media.${compareIndex}.${spec.path}`} label={spec.label} {...spec} />
            )}
          </Box>
        </FormProvider>
      </Stack>
    </Stack>
  );
};

const ComparableMediaItem = ({ currentMedia, compareMedia, compareItem, index, onCopyMedia, compareFormMethods, diffFields }) => {
  const hasCurrentMedia = !!currentMedia;
  const hasCompareMedia = !!compareMedia;

  return (
    <Stack spacing={2}>
      {MEDIA_FIELD_SPECS.map((spec) => (
        <MediaFieldCompare
          key={spec.path}
          spec={spec}
          index={index}
          compareIndex={compareItem?.index}
          onCopyMedia={onCopyMedia}
          compareFormMethods={compareFormMethods}
          hasCurrentMedia={hasCurrentMedia}
          hasCompareMedia={hasCompareMedia}
          diffFields={diffFields}
        />
      ))}
    </Stack>
  );
};

export const CompareMediaSection = ({ formData, compareData, compareFormMethods, getValues, setValue, diffFields }) => {
  const [mediaChanges, setMediaChanges] = useState({});
  const [removedMediaIds, setRemovedMediaIds] = useState(new Set());
  const [addedMediaIds, setAddedMediaIds] = useState(new Set());

  // Normalize media_id to string for consistent comparison
  const normalizeMediaId = (mediaId, idx) => String(mediaId || `new-${idx}`);

  // Index compare items by media_id for O(1) lookup
  const compareMediaById = Object.fromEntries(
    (compareData.media || []).map((m, idx) => [normalizeMediaId(m.media_id, idx), { media: m, index: idx }])
  );

  // Step through current data and look up compare matches
  const allPairs = (formData.media || []).map((currentMedia, currentIdx) => {
    const mediaId = normalizeMediaId(currentMedia.media_id, currentIdx);
    const compareItem = compareMediaById[mediaId] || null;

    return {
      mediaId,
      current: { media: currentMedia, index: currentIdx },
      compare: compareItem,
    };
  });

  // Add compare-only items (not matched with current)
  const currentMediaIds = new Set((formData.media || []).map((m, idx) => normalizeMediaId(m.media_id, idx)));
  Object.entries(compareMediaById).forEach(([mediaId, compareItem]) => {
    if (!currentMediaIds.has(mediaId)) {
      allPairs.push({
        mediaId,
        current: null,
        compare: compareItem,
      });
    }
  });

  const handleReplaceMedia = (currentIndex, compareItem, mediaId) => {
    if (compareItem) {
      const currentMedia = getValues("media");
      const updated = [...currentMedia];
      updated[currentIndex] = { ...compareItem, media_id: compareItem.media_id };
      setValue("media", updated, { shouldValidate: true, shouldDirty: true });
      setMediaChanges((prev) => ({ ...prev, [mediaId]: currentIndex }));
    }
  };

  const handleRemoveMedia = (mediaId) => {
    setRemovedMediaIds((prev) => new Set([...prev, mediaId]));
  };

  const handleUndoRemoveMedia = (mediaId) => {
    setRemovedMediaIds((prev) => {
      const updated = new Set(prev);
      updated.delete(mediaId);
      return updated;
    });
  };

  const handleAddMedia = (compareMediaItem, mediaId) => {
    if (compareMediaItem) {
      const currentMedia = getValues("media") || [];
      const newItem = { ...compareMediaItem };
      setValue("media", [...currentMedia, newItem], { shouldValidate: true, shouldDirty: true });
      setAddedMediaIds((prev) => new Set([...prev, mediaId]));
    }
  };

  const handleUndoAddMedia = (mediaId) => {
    const currentMedia = getValues("media") || [];
    const filtered = currentMedia.filter((_, idx) => {
      const id = normalizeMediaId(currentMedia[idx].media_id, idx);
      return id !== mediaId;
    });
    setValue("media", filtered, { shouldValidate: true, shouldDirty: true });
    setAddedMediaIds((prev) => {
      const updated = new Set(prev);
      updated.delete(mediaId);
      return updated;
    });
  };

  return (
    <Stack direction="column" spacing={3}>
      {allPairs.map((pair, itemNum) => {
        const { mediaId, current, compare } = pair;
        const isRemoved = removedMediaIds.has(mediaId);
        const isAdded = addedMediaIds.has(mediaId);

        return (
          <Paper
            key={mediaId}
            sx={{
              p: 3,
              backgroundColor:
                isRemoved ? "action.disabledBackground" : isAdded ? "action.hover" : "background.default",
              borderRadius: 1,
              border: "1px solid",
              borderColor: isRemoved ? "error.light" : "divider",
              opacity: isRemoved ? 0.6 : 1,
              textDecoration: isRemoved ? "line-through" : "none",
            }}
          >
            <Stack spacing={2}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle2" sx={{ fontWeight: 600, opacity: isRemoved ? 0.6 : 1 }}>
                  Media Item {itemNum + 1}
                  {isRemoved && " (removed)"}
                  {isAdded && " (added)"}
                </Typography>
                {current && compare && (
                  <UndoableActionButton
                    isDirty={!!mediaChanges[mediaId]}
                    hasDiff={true}
                    tooltip="Replace current item with comparison version"
                    onCopy={() => handleReplaceMedia(current.index, compare.media, mediaId)}
                    onRestore={() => setMediaChanges((prev) => {
                      const updated = { ...prev };
                      delete updated[mediaId];
                      return updated;
                    })}
                    size="small"
                  >
                    <KeyboardDoubleArrowLeft sx={{ mr: 0.5, fontSize: "small" }} />
                    Replace
                  </UndoableActionButton>
                )}
                {current && !compare && (
                  <UndoableActionButton
                    isDirty={isRemoved}
                    hasDiff={true}
                    tooltip="Remove this media item"
                    onCopy={() => handleRemoveMedia(mediaId)}
                    onRestore={() => handleUndoRemoveMedia(mediaId)}
                    size="small"
                  >
                    <Icon sx={{ mr: 0.5, fontSize: "small" }}>delete</Icon>
                    Remove
                  </UndoableActionButton>
                )}
                {!current && compare && (
                  <UndoableActionButton
                    isDirty={isAdded}
                    hasDiff={true}
                    tooltip="Add this media item from comparison"
                    onCopy={() => handleAddMedia(compare.media, mediaId)}
                    onRestore={() => handleUndoAddMedia(mediaId)}
                    size="small"
                  >
                    <Icon sx={{ mr: 0.5, fontSize: "small" }}>add</Icon>
                    Add
                  </UndoableActionButton>
                )}
              </Stack>
              <ComparableMediaItem
                currentMedia={current?.media ?? null}
                compareMedia={compare?.media ?? null}
                compareItem={compare}
                index={current?.index}
                onCopyMedia={() =>
                  current && compare && handleReplaceMedia(current.index, compare.media, mediaId)
                }
                compareFormMethods={compareFormMethods}
                diffFields={diffFields}
              />
            </Stack>
          </Paper>
        );
      })}
    </Stack>
  );
};

export default CompareMediaSection;
