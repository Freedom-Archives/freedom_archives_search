import KeyboardDoubleArrowLeft from "@mui/icons-material/KeyboardDoubleArrowLeft";
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
import CompareMediaSection from "src/components/CompareMediaSection";
import { Field } from "src/components/form/Field";
import useFormManagerContext from "src/components/form/FormManagerContext";
import { getDefaultValuesFromSchema } from "src/components/form/schemaUtils";
import Link from "src/components/Link";
import Show from "src/components/Show";
import { RenderTime } from "src/views/EditItemView";

export const UndoableActionButton = ({ isDirty, hasDiff, tooltip, onCopy, onRestore, children, size = "medium" }) => {
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

const CompareRow = ({ children, isDirty, hasDiff, tooltip, onCopy, onRestore }) => {
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
          <KeyboardDoubleArrowLeft />
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
  return diffs;
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
      <Divider sx={{ my: 1 }} />
      <Stack direction="column" spacing={1}>
        <RenderTime item={data} type="created" />
        <RenderTime item={data} type="modified" />
      </Stack>
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
    formContext: { setValue, getValues },
  } = useFormManagerContext();
  const formData = getValues();

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
        <CompareMediaSection formData={formData} compareData={compareData} compareFormMethods={compareFormMethods} />
      </FormSection>
    </Stack>
  );
};

const CompareField = ({ name, options, index, groupIndex, hasDiff, compareFormMethods }) => {
  const { setValue, resetField, formState } = useFormContext();
  const isDirty = get(formState.dirtyFields, name);

  const handleCopyRight = () => {
    const compareValue = compareFormMethods.getValues(name);
    setValue(name, compareValue, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  return (
    <CompareRow
      isDirty={isDirty}
      hasDiff={hasDiff}
      tooltip="Replace current value with value from right column"
      onCopy={handleCopyRight}
      onRestore={() => resetField(name)}
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
