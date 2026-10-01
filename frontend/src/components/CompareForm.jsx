import Add from "@mui/icons-material/Add";
import KeyboardDoubleArrowLeft from "@mui/icons-material/KeyboardDoubleArrowLeft";
import Replay from "@mui/icons-material/Replay";
import SwapHoriz from "@mui/icons-material/SwapHoriz";
import { Box, Icon } from "@mui/material";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import dayjs from "dayjs";
import { get, isEqual, isObject } from "lodash-es";
import { useEffect, useState } from "react";
import { FormProvider, useForm, useFormContext } from "react-hook-form";
import CompositeIcon from "src/components/CompositeIcon";
import { Field } from "src/components/form/Field";
import useFormManagerContext from "src/components/form/FormManagerContext";
import { getDefaultValuesFromSchema } from "src/components/form/schemaUtils";
import Link from "src/components/Link";
import Show from "src/components/Show";
import { RenderTime } from "src/views/EditItemView";

// import CompositeIcon from 'src/components/utils/CompositeIcon'
// import { Field } from 'src/components/utils/Field'
// import { ModInfo } from 'src/components/utils/Footer'
// import FormSection from 'src/components/utils/FormSection'
// // import TextLink from 'src/components/utils/Link'
// import Show from 'src/components/utils/Show'
// import dayjs from 'src/lib/dayjs'
// import { transformData } from 'src/lib/transforms'

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

const CompareRow = ({ children, isDirty, hasDiff, tooltip, onCopy, onRestore, append }) => {
  return (
    <Grid container size={12} alignItems={"start"} spacing={2}>
      <Grid size="grow">{children[0]}</Grid>
      <Grid alignSelf={"center"}>
        <UndoableActionButton
          isDirty={isDirty}
          hasDiff={hasDiff}
          tooltip={tooltip}
          onCopy={onCopy}
          onRestore={onRestore}
        >
          {append ? (
            <CompositeIcon baseIcon={KeyboardDoubleArrowLeft} overlayIcon={Add} />
          ) : (
            <KeyboardDoubleArrowLeft />
          )}
        </UndoableActionButton>
      </Grid>
      <Grid size="grow">{children[1]}</Grid>
    </Grid>
  );
};

const compareObjects = (obj1, obj2, path = "", diffs = new Set()) => {
  if (!isObject(obj1) || !isObject(obj2)) {
    if (!isEqual(obj1, obj2)) {
      diffs.add(path);
    }
    return diffs;
  }

  const allKeys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);

  allKeys.forEach((key) => {
    const currentPath = path ? `${path}.${key}` : key;
    const value1 = obj1[key];
    const value2 = obj2[key];
    if (path === "" && !(key in obj1)) {
      diffs.delete(key);
      return;
    }
    // console.log("comparing", currentPath, value1, value2, obj1, obj2);

    if (dayjs.isDayjs(value1) || dayjs.isDayjs(value2)) {
      if (!value1 || !value1?.isSame(value2)) {
        diffs.add(currentPath);
        diffs.add(path);
      }
    } else if (isObject(value1) || isObject(value2)) {
      diffs = compareObjects(value1, value2, currentPath, diffs);
    } else if (!isEqual(value1 || "", value2 || "")) {
      diffs.add(currentPath);
      diffs.add(path);
    }
  });
  // console.log("diffs so far", diffs);
  return diffs;
};

const MEDIA_FIELD_SPECS = [
  {
    path: "media_id",
  },
  {
    path: "is_primary",
    label: "Primary",
    field_type: "checkbox",
  },
  {
    path: "call_number_item",
    label: "Call Number",
    field_type: "list_item",
    itemType: "call_number",
    fetchAll: true,
  },
  { path: "call_number_suffix", label: "Suffix" },
  {
    path: "generation_item",
    label: "Generation",
    field_type: "list_item",
    itemType: "generation",
    fetchAll: true,
  },
  {
    path: "format_item",
    label: "Format",
    field_type: "list_item",
    itemType: "format",
    fetchAll: true,
  },
  {
    path: "quality_item",
    label: "Quality",
    field_type: "list_item",
    itemType: "quality",
    fetchAll: true,
  },
  { path: "no_copies", label: "Copies", type: "number" },
  { path: "url", label: "URL" },
];

const getMediaFieldValue = (media, fieldName) => {
  if (fieldName === "call_number_item") return media?.call_number_item?.item || media?.call_number;
  if (fieldName === "generation_item") return media?.generation_item?.item;
  if (fieldName === "format_item") return media?.format_item?.item;
  if (fieldName === "quality_item") return media?.quality_item?.item;
  return media?.[fieldName];
};

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
  const currentValue = hasCurrentMedia ? getCurrentValues?.(`media.${index}.${spec.path}`) : undefined;
  const compareValue = hasCompareMedia && compareIndex !== undefined ? getCompareValues?.(`media.${compareIndex}.${spec.path}`) : undefined;
  const fieldName = `media.${index}.${spec.path}`;
  const hasDiff = diffFields.has(fieldName);

  if (spec.path === "call_number_item") {
    console.log("MediaFieldCompare:", {
      hasCurrentMedia,
      hasCompareMedia,
      index,
      compareIndex,
      fieldName,
      currentValue,
      compareValue,
    });
  }

  return (
    <Stack spacing={1}>
      <CompareRow
        isDirty={false}
        hasDiff={hasDiff}
        tooltip="Copy from comparison record"
        onCopy={() => onCopyMedia(index)}
        onRestore={() => {}}
        append={false}
      >
        <Box sx={{ visibility: !hasCurrentMedia ? "hidden" : "visible" }}>
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
        <FormProvider {...compareFormMethods}>
          <Box sx={{ visibility: !hasCompareMedia ? "hidden" : "visible" }}>
            {hasCompareMedia && compareIndex !== undefined && <Field disabled={true} name={`media.${compareIndex}.${spec.path}`} label={spec.label} {...spec} />}
          </Box>
        </FormProvider>
      </CompareRow>
    </Stack>
  );
};

const ComparableMediaItem = ({ currentMedia, compareMedia, compareItem, index, mediaId, bothExist, onCopyMedia, compareFormMethods, diffFields }) => {
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

const FormSection = ({ title, sectionActions, children }) => {
  return (
    <Paper sx={{ p: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">{title}</Typography>
        <div>{sectionActions}</div>
      </Stack>
      <Stack direction="column" spacing={2}>
        {children}
      </Stack>
    </Paper>
  );
};

const CompareFormSection = ({
  showOnlyDiffs,
  fields: sectionFields,
  schema,
  groupIndex,
  title,
  sectionActions,
  compareFormMethods,
  diffFields,
}) => {
  const fields = sectionFields.map((name, index) => {
    const props = schema[name];
    return [name, props, index];
  });
  if (showOnlyDiffs && !fields.some(([name]) => diffFields.has(name))) {
    return null;
  }
  return (
    <FormSection key={groupIndex} title={title} sectionActions={sectionActions}>
      <Grid container sx={{ alignItems: "start" }} size={12}>
        {fields.map(([key, options = {}], index) => (
          <Show when={!showOnlyDiffs || diffFields.has(key)} key={key}>
            <CompareField
              name={key}
              options={options}
              index={index}
              groupIndex={groupIndex}
              hasDiff={diffFields.has(key)}
              compareFormMethods={compareFormMethods}
            />
          </Show>
        ))}
      </Grid>
    </FormSection>
  );
};

function DataCard({ title, data, route, id, align = "right" }) {
  return (
    <Paper sx={{ p: 2, width: "100%", textAlign: align }}>
      <Typography variant="h5">
        <Link to={`${route}/${id}`} target="_blank">
          {title}
        </Link>
      </Typography>
      {/* <Typography color="GrayText" variant="subtitle2"> */}
      {/* {subtitle} */}
      {/* </Typography> */}
      <Divider sx={{ my: 1 }} />
      <Stack direction="column" spacing={1}>
        <RenderTime item={data} type="created" />
        <RenderTime item={data} type="modified" />
      </Stack>
      {/* <ModInfo
        stats={stats}
        formData={data}
        sx={{ flexWrap: 'wrap' }}
        useFlexGap
      /> */}
    </Paper>
  );
}

const CompareForm = ({
  compareData: inputData,
  fields,
  schema,
  loading,
  id,
  service,
  hideSwap = false,
  versions = false,
}) => {
  const [showOnlyDiffs, setShowOnlyDiffs] = useState(true);
  const [diffFields, setDiffFields] = useState(new Set());
  const [compareStats, setCompareStats] = useState({});
  const [mediaChanges, setMediaChanges] = useState({}); // Track media item replacements: mediaId -> originalIndex
  const [removedMediaIds, setRemovedMediaIds] = useState(new Set()); // Track removed items for undo
  const {
    stats,
    // formState: { defaultValues },
    formContext: { setValue, getValues },
  } = useFormManagerContext();
  const formData = getValues();
  // const stuff = useFormManagerContext()

  // const { id, compareId } = useParams()
  const compareFormMethods = useForm({});
  const compareId = inputData?.record_id;

  const mergeBlankValues = () => {
    for (const key of diffFields) {
      const compareValue = compareFormMethods.getValues(key);
      const prevValue = getValues(key);
      if (compareValue !== null && prevValue == null) {
        setValue(key, compareValue, {
          shouldValidate: true,
          shouldDirty: true,
        });
      }
    }
  };

  useEffect(() => {
    if (inputData) {
      const compareData = getDefaultValuesFromSchema(service, inputData);
      const currentData = getDefaultValuesFromSchema(service, getValues());
      compareFormMethods.reset(inputData);
      const diffs = compareObjects(currentData, compareData);
      console.log("diffs", diffs);
      setDiffFields(diffs);
      setCompareStats({
        created: dayjs(inputData?.created_at),
        updated: dayjs(inputData?.updated_at),
        date: dayjs(inputData?.date),
      });
    }
  }, [inputData, service, compareFormMethods, getValues]);

  if (loading) {
    return null;
  }

  const layout = fields.map((section, index) => ({
    ...section,
    key: section.title || index,
    // fields: section.fields.map(([name]) => name),
  }));

  const sections = layout.map(({ key, ...section }, groupIndex) => {
    return (
      <CompareFormSection
        key={key}
        showOnlyDiffs={showOnlyDiffs}
        schema={schema}
        groupIndex={groupIndex}
        diffFields={diffFields}
        compareFormMethods={compareFormMethods}
        {...section}
      />
    );
  });
  const compareData = compareFormMethods.getValues();

  const appendMediaItem = (index) => {
    const mediaItem = compareData.media?.[index];
    if (!mediaItem) return;
    const currentMedia = formData.media || [];
    const updatedMedia = [...currentMedia, mediaItem];
    const compareMedia = compareData.media.filter((_, i) => i !== index);
    setValue("media", updatedMedia, {
      shouldValidate: true,
      shouldDirty: true,
    });
    compareFormMethods.setValue("media", compareMedia);
  };

  return (
    <Stack direction="column" spacing={2}>
      <Paper sx={{ p: 2 }}>
        Compare the current record in the left column with the record values in the right column. Use the
        <IconButton variant="outlined">
          <KeyboardDoubleArrowLeft />
        </IconButton>
        button to replace values in the left column with those from the right.
        <Show unless={versions}>
          <br />
          <FormControlLabel
            control={<Switch checked={showOnlyDiffs} onChange={(e) => setShowOnlyDiffs(e.target.checked)} />}
            label="Only show fields with differences"
          />
          <Tooltip title="Update all empty values in the left column with non-empty values from the right column">
            <span>
              <Button variant="outlined" onClick={mergeBlankValues} disabled={diffFields.size === 0}>
                Merge Blank Values
              </Button>
            </span>
          </Tooltip>
        </Show>
      </Paper>
      <Stack direction={"row"} spacing={2} alignItems="center" sx={{ justifyContent: "space-between" }}>
        <DataCard title={formData?.title} data={formData} stats={stats} route="/admin/records" id={id} align="left" />
        {!hideSwap && (
          <Tooltip title="Swap comparison">
            <Link to={`/admin/site/find-duplicates/${compareId}/${id}`}>
              <Button variant="outlined" size="small">
                <SwapHoriz />
              </Button>
            </Link>
          </Tooltip>
        )}
        <DataCard
          title={inputData?.title}
          // subtitle={`${compareStats?.date ? compareStats.date.tz().format('L LT') : ''} - ${inputData?.arrest_city}`}
          data={inputData}
          stats={compareStats}
          route="/admin/records"
          id={compareId}
        />
      </Stack>
      {sections}
      <FormSection title="Media">
        <Stack direction="column" spacing={3}>
          {(() => {
            // Index compare items by media_id for O(1) lookup (convert to string for consistent keys)
            const compareMediaById = Object.fromEntries(
              (compareData.media || []).map((m, idx) => [String(m.media_id || `compare-new-${idx}`), { media: m, index: idx }])
            );

            // Step through current data and look up compare matches
            const allPairs = (formData.media || []).map((currentMedia, currentIdx) => {
              const mediaId = String(currentMedia.media_id || `current-new-${currentIdx}`);
              const compareItem = compareMediaById[mediaId] || null;

              return {
                mediaId,
                current: { media: currentMedia, index: currentIdx },
                compare: compareItem,
              };
            });

            // Add compare-only items (not matched with current)
            const currentMediaIds = new Set((formData.media || []).map((m, idx) => String(m.media_id || `current-new-${idx}`)));
            console.log("currentMediaIds:", currentMediaIds);
            console.log("compareMediaById keys:", Object.keys(compareMediaById));

            Object.entries(compareMediaById).forEach(([mediaId, compareItem]) => {
              console.log(`Checking compare mediaId: ${mediaId}, exists in current: ${currentMediaIds.has(mediaId)}`);
              if (!currentMediaIds.has(mediaId)) {
                console.log(`Adding compare-only item: ${mediaId}`);
                allPairs.push({
                  mediaId,
                  current: null,
                  compare: compareItem,
                });
              }
            });

            const handleReplaceMedia = (currentIndex, compareItem, pairMediaId) => {
              if (compareItem) {
                const currentMedia = getValues("media");
                const updated = [...currentMedia];
                updated[currentIndex] = { ...compareItem, media_id: compareItem.media_id };
                setValue("media", updated, { shouldValidate: true, shouldDirty: true });
                setMediaChanges((prev) => ({ ...prev, [pairMediaId]: currentIndex }));
              }
            };

            const handleRemoveMedia = (mediaId, currentIndex) => {
              setRemovedMediaIds((prev) => new Set([...prev, mediaId]));
            };

            const handleAddMedia = (compareItem) => {
              if (compareItem) {
                const currentMedia = getValues("media") || [];
                const newItem = { ...compareItem, media_id: "" };
                setValue("media", [...currentMedia, newItem], { shouldValidate: true, shouldDirty: true });
              }
            };

            const handleUndoMedia = (mediaId) => {
              setMediaChanges((prev) => {
                const updated = { ...prev };
                delete updated[mediaId];
                return updated;
              });
            };

            const handleUndoRemoveMedia = (mediaId) => {
              setRemovedMediaIds((prev) => {
                const updated = new Set(prev);
                updated.delete(mediaId);
                return updated;
              });
            };

            return allPairs.map((pair, itemNum) => {
              const { mediaId, current, compare } = pair;
              const isDirty = !!mediaChanges[mediaId];
              const isRemoved = removedMediaIds.has(mediaId);

              return (
                <Paper
                  key={mediaId}
                  sx={{
                    p: 3,
                    backgroundColor: isRemoved ? "action.disabledBackground" : "background.default",
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
                        Media Item {itemNum + 1} {isRemoved && "(removed)"}
                      </Typography>
                      {current && compare && (
                        <UndoableActionButton
                          isDirty={isDirty}
                          hasDiff={true}
                          tooltip="Replace current item with comparison version"
                          onCopy={() => handleReplaceMedia(current.index, compare.media, mediaId)}
                          onRestore={() => handleUndoMedia(mediaId)}
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
                          onCopy={() => handleRemoveMedia(mediaId, current.index)}
                          onRestore={() => handleUndoRemoveMedia(mediaId)}
                          size="small"
                        >
                          <Icon sx={{ mr: 0.5, fontSize: "small" }}>delete</Icon>
                          Remove
                        </UndoableActionButton>
                      )}
                      {!current && compare && (
                        <Tooltip title="Add this media item from comparison">
                          <Button size="small" variant="outlined" onClick={() => handleAddMedia(compare.media)}>
                            <Icon sx={{ mr: 0.5, fontSize: "small" }}>add</Icon>
                            Add
                          </Button>
                        </Tooltip>
                      )}
                    </Stack>
                    <ComparableMediaItem
                      currentMedia={current?.media ?? null}
                      compareMedia={compare?.media ?? null}
                      compareItem={compare}
                      index={current?.index}
                      mediaId={mediaId}
                      bothExist={!!(current && compare)}
                      onCopyMedia={() =>
                        current && compare && handleReplaceMedia(current.index, compare.media, mediaId)
                      }
                      compareFormMethods={compareFormMethods}
                      diffFields={diffFields}
                    />
                  </Stack>
                </Paper>
              );
            });
          })()}
        </Stack>
      </FormSection>
    </Stack>
  );
};

const CompareField = ({ name, options, index, groupIndex, hasDiff, compareFormMethods }) => {
  const { setValue, resetField, formState, getValues } = useFormContext();
  const isDirty = get(formState.dirtyFields, name);
  const append = false;

  const handleCopyRight = () => {
    const compareValue = compareFormMethods.getValues(name);
    const prevValue = getValues(name);
    const updatedValue = append && prevValue ? `${prevValue}\n${compareValue || ""}` : compareValue;

    setValue(name, updatedValue, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const tooltip = append
    ? "Append value from right column to current value"
    : "Replace current value with value from right column";

  return (
    <CompareRow
      isDirty={isDirty}
      hasDiff={hasDiff}
      tooltip={tooltip}
      onCopy={handleCopyRight}
      onRestore={() => resetField(name)}
      append={append}
    >
      <Field
        tabIndex={100 * (groupIndex + 1) + index}
        highlightDirty={true}
        name={name}
        {...options}
        color={hasDiff ? "info" : null}
      />
      <FormProvider {...compareFormMethods}>
        <Field name={name} disabled={true} {...options} />
      </FormProvider>
    </CompareRow>
  );
};

export default CompareForm;
