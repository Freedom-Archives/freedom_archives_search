import Add from "@mui/icons-material/Add";
import KeyboardDoubleArrowLeft from "@mui/icons-material/KeyboardDoubleArrowLeft";
import OpenInNew from "@mui/icons-material/OpenInNew";
import Replay from "@mui/icons-material/Replay";
import SwapHoriz from "@mui/icons-material/SwapHoriz";
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

const MediaCard = ({ media, index }) => {
  if (!media) return null;

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6">{media?.call_number || "No Call Number"}</Typography>
      <Grid container spacing={2} alignItems="center">
        {/* Primary indicator */}
        {/* <Grid size="auto">
          <IconButton size="small" disabled>
            {media.is_primary ? <RadioButtonChecked /> : <RadioButtonUnchecked />}
          </IconButton>
        </Grid> */}

        {/* Generation */}
        <Grid size="auto">
          <Typography variant="caption" color="textSecondary">
            Generation
          </Typography>
          <Typography variant="body2">{media.generation_item?.item || "—"}</Typography>
        </Grid>

        {/* Format */}
        <Grid size="auto">
          <Typography variant="caption" color="textSecondary">
            Format
          </Typography>
          <Typography variant="body2">{media.format_item?.item || "—"}</Typography>
        </Grid>

        {/* Quality */}
        <Grid size="auto">
          <Typography variant="caption" color="textSecondary">
            Quality
          </Typography>
          <Typography variant="body2">{media.quality_item?.item || "—"}</Typography>
        </Grid>

        {/* Copies */}
        <Grid size="auto">
          <Typography variant="caption" color="textSecondary">
            Copies
          </Typography>
          <Typography variant="body2">{media.no_copies || 1}</Typography>
        </Grid>

        {/* URL */}
        {media.url && (
          <Grid size="auto">
            <Tooltip title={media.url}>
              <Link href={media.url} target="_blank" rel="noreferrer">
                <IconButton size="small">
                  <OpenInNew fontSize="small" />
                </IconButton>
              </Link>
            </Tooltip>
          </Grid>
        )}
      </Grid>
    </Paper>
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
        <Stack direction="column" spacing={2}>
          {Array.from({ length: Math.max(formData?.media?.length, compareData?.media?.length) }, (_, index) => (
            <Grid container alignItems={"center"} spacing={2} key={index}>
              {/* Left column */}
              <Grid size="grow">
                {formData.media?.[index] && <MediaCard media={formData.media[index]} index={index} />}
              </Grid>
              <Grid size="auto">
                {
                  <Tooltip title="Move media item to current record">
                    <Button
                      variant="outlined"
                      sx={{ visibility: compareData.media?.[index] ? "visible" : "hidden" }}
                      onClick={() => appendMediaItem(index)}
                    >
                      <CompositeIcon baseIcon={KeyboardDoubleArrowLeft} overlayIcon={Add} />
                    </Button>
                  </Tooltip>
                }
              </Grid>
              <Grid size="grow">{compareData.media?.[index] && <MediaCard media={compareData.media[index]} />}</Grid>
            </Grid>
          ))}
        </Stack>
      </FormSection>
    </Stack>
  );
};

const CompareField = ({ name, options, index, groupIndex, hasDiff, compareFormMethods }) => {
  const { setValue, resetField, formState, getValues } = useFormContext(); // Get form context from parent
  const isDirty = get(formState.dirtyFields, name);
  const append = false; // options.field_type === "textarea";

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
    <Grid container size={12} alignItems={"start"} spacing={2}>
      <Grid size="grow">
        <Field
          tabIndex={100 * (groupIndex + 1) + index}
          highlightDirty={true}
          name={name}
          {...options}
          color={hasDiff ? "info" : null}
        />
      </Grid>
      <Grid alignSelf={"center"}>
        {isDirty ? (
          <Tooltip title="Restore current value">
            <span>
              <Button variant="outlined" onClick={() => resetField(name)} disabled={!hasDiff}>
                <Replay />
              </Button>
            </span>
          </Tooltip>
        ) : (
          <Tooltip title={tooltip}>
            <Button variant="outlined" onClick={handleCopyRight}>
              {append ? (
                <CompositeIcon baseIcon={KeyboardDoubleArrowLeft} overlayIcon={Add} />
              ) : (
                <KeyboardDoubleArrowLeft />
              )}
            </Button>
          </Tooltip>
        )}
      </Grid>
      <Grid size="grow">
        <FormProvider {...compareFormMethods}>
          <Field name={name} disabled={true} {...options} />
        </FormProvider>
      </Grid>
    </Grid>
  );
};

export default CompareForm;
