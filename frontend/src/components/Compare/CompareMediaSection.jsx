import Stack from "@mui/material/Stack";
import { get, omit } from "lodash-es";
import { useEffect, useState } from "react";
import { useFormState, useWatch } from "react-hook-form";
import { CompareChangesSection, CompareField, ItemActionButton } from "src/components/Compare/CompareSharedComponents";
import { getMediaComparison, getMediaPairs, summarizeStatuses } from "src/components/Compare/CompareUtils";
import useFormManagerContext from "src/components/form/FormManagerContext";

import { MEDIA_FIELD_SPECS, STATUS_LABELS } from "./compareConfig";
import CompareMediaCard from "./CompareMediaCard";

// One compared media item (a getMediaPairs pair), with the action for its status and its compared fields
//   isReplaced: the item has been replaced with its comparison version
//   actions: the section's per-item actions, each taking the pair (see CompareMediaSection)
const MediaPairCard = ({
  pair,
  itemNum,
  showOnlyDiffs,
  versions,
  isReplaced,
  actions,
  groupIndex,
  compareFormMethods,
  copyTooltip,
}) => {
  const { current, compare, isAdded, itemDiffs, diffSpecs, status } = pair;
  if (showOnlyDiffs && !status) {
    return null;
  }
  const isRemoved = !!current?.media.delete;
  const fieldSpecs = showOnlyDiffs ? diffSpecs : MEDIA_FIELD_SPECS;
  // Items the user has acted on are highlighted as changed, like edited fields
  const actedOn = isAdded || isRemoved || isReplaced;

  let action = null;
  if (status === "changed") {
    action = (
      <ItemActionButton
        action="revert"
        label={versions ? "Restore" : "Replace"}
        isDirty={isReplaced}
        tooltip={
          versions ? "Restore this item from the comparison version" : "Replace current item with comparison version"
        }
        onAction={() => actions.replace(pair)}
        onUndo={() => actions.undoReplace(pair)}
      />
    );
  } else if (status === "added") {
    action = (
      <ItemActionButton
        action="remove"
        isDirty={isRemoved}
        tooltip="Remove this media item"
        onAction={() => actions.remove(pair)}
        onUndo={() => actions.undoRemove(pair)}
      />
    );
  } else if (status === "removed") {
    // Once restored, the item is in the current record, so keep showing its undo
    action = (
      <ItemActionButton
        action="restore"
        label={versions ? "Restore" : "Copy"}
        isDirty={isAdded}
        tooltip={
          versions
            ? "Restore this media item from the comparison version"
            : "Copy this media item from the other record"
        }
        onAction={() => actions.restore(pair)}
        onUndo={() => actions.undoRestore(pair)}
      />
    );
  }

  let note = null;
  if (isRemoved) {
    note = "to be deleted";
  } else if (isAdded) {
    note = versions ? "restored" : "copied";
  } else if (!status) {
    note = "no differences";
  }

  return (
    <CompareMediaCard
      media={(current ?? compare).media}
      note={note}
      status={status}
      statusLabels={versions ? STATUS_LABELS.versions : STATUS_LABELS.duplicates}
      highlight={actedOn ? "success" : undefined}
      actions={action}
      muted={isRemoved || !current}
    >
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
    </CompareMediaCard>
  );
};

// Compares the media in the form with the comparison version's media. Changed items can be restored whole or field
// by field, removed items restored and added items removed, or all the media restored from the comparison version.
//   versions: comparing with a saved version, so changed items are "restored" rather than "replaced"
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
  const { dirtyFields, defaultValues } = useFormState({ control });
  const [comparison, setComparison] = useState({ contentMatches: {}, diffs: {} }); // a getMediaComparison result
  const [mediaChanges, setMediaChanges] = useState({}); // mediaId -> original item, before Replace
  // Comparison media_ids of the items restored into the current record, in the order they were added
  const [addedMediaIds, setAddedMediaIds] = useState([]);

  // Compare once per comparison record, so the comparison stays stable as fields are copied
  useEffect(() => {
    setComparison(getMediaComparison(getValues("media"), compareData?.media));
  }, [compareData, getValues]);

  const pairs = getMediaPairs(currentMedia, compareData?.media, comparison, addedMediaIds);
  const statuses = pairs.map(({ status }) => status);
  const hasDiff = statuses.some(Boolean);
  if (showOnlyDiffs && !hasDiff) {
    return null;
  }

  const setMedia = (media) => setValue("media", media, { shouldValidate: true, shouldDirty: true });

  const replaceMediaItem = (index, item) => {
    setMedia(getValues("media").map((m, idx) => (idx === index ? item : m)));
  };

  // Clear the ids so the item is created as new media on the current record when saved
  const restoredMediaItem = (compareItem) => ({ ...compareItem, media_id: null, record_id: null });

  // Per-item actions, each taking a media pair
  const actions = {
    replace: ({ mediaId, current, compare }) => {
      replaceMediaItem(current.index, { ...compare.media });
      setMediaChanges((prev) => ({ ...prev, [mediaId]: current.media }));
    },
    undoReplace: ({ mediaId, current }) => {
      replaceMediaItem(current.index, mediaChanges[mediaId]);
      setMediaChanges(({ [mediaId]: _restored, ...rest }) => rest);
    },
    // Flag the item for deletion when the record is saved
    remove: ({ current }) => replaceMediaItem(current.index, { ...current.media, delete: true }),
    undoRemove: ({ current }) => replaceMediaItem(current.index, omit(current.media, "delete")),
    restore: ({ mediaId, compare }) => {
      setMedia([...(getValues("media") || []), restoredMediaItem(compare.media)]);
      setAddedMediaIds((prev) => [...prev, mediaId]);
    },
    undoRestore: ({ mediaId, current }) => {
      setMedia(getValues("media").filter((_, idx) => idx !== current.index));
      setAddedMediaIds((prev) => prev.filter((id) => id !== mediaId));
    },
  };

  // Make the media match the comparison version: restore changed items, remove added ones and restore removed ones
  const handleRestoreAll = () => {
    const media = getValues("media") || [];
    const replaced = {};
    const updated = media.map((item, index) => {
      const pair = pairs.find(({ current }) => current?.index === index);
      if (pair?.status === "changed" && !mediaChanges[pair.mediaId]) {
        replaced[pair.mediaId] = item;
        return { ...pair.compare.media };
      }
      return pair?.status === "added" ? { ...item, delete: true } : item;
    });
    const restored = pairs.filter(({ current }) => !current);
    setMedia([...updated, ...restored.map(({ compare }) => restoredMediaItem(compare.media))]);
    setMediaChanges((prev) => ({ ...prev, ...replaced }));
    setAddedMediaIds((prev) => [...prev, ...restored.map(({ mediaId }) => mediaId)]);
  };

  const handleUndoAll = () => {
    setMedia(get(defaultValues, "media"));
    setMediaChanges({});
    setAddedMediaIds([]);
  };

  const isDirty = !!get(dirtyFields, "media");

  return (
    <CompareChangesSection
      title="Media"
      summary={summarizeStatuses(statuses, versions ? STATUS_LABELS.versions : STATUS_LABELS.duplicates)}
      note={isDirty && "unsaved changes"}
      // Only offered against a saved version: for duplicates, it would delete all of this record's own media
      restoreAll={
        versions &&
        hasDiff && {
          isDirty,
          tooltip: "Restore all media from the comparison version",
          onAction: handleRestoreAll,
          onUndo: handleUndoAll,
        }
      }
    >
      <Stack direction="column" spacing={3}>
        {pairs.map((pair, itemNum) => (
          <MediaPairCard
            key={pair.mediaId}
            pair={pair}
            itemNum={itemNum}
            showOnlyDiffs={showOnlyDiffs}
            versions={versions}
            isReplaced={!!mediaChanges[pair.mediaId]}
            actions={actions}
            groupIndex={groupIndex}
            compareFormMethods={compareFormMethods}
            copyTooltip={copyTooltip}
          />
        ))}
      </Stack>
    </CompareChangesSection>
  );
};

export default CompareMediaSection;
