import KeyboardDoubleArrowLeft from "@mui/icons-material/KeyboardDoubleArrowLeft";
import SwapHoriz from "@mui/icons-material/SwapHoriz";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import CompareMediaSection from "src/components/Compare/CompareMediaSection";
import useFormManagerContext from "src/components/form/FormManagerContext";
import { getDefaultValuesFromSchema } from "src/components/form/schemaUtils";
import Link from "src/components/Link";
import Show from "src/components/Show";
import { RenderTime } from "src/views/EditItemView";

import { CompareField } from "./CompareSharedComponents";
import { compareObjects } from "./CompareUtils";

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
  const fields = showOnlyDiffs ? sectionFields.filter((name) => diffFields.has(name)) : sectionFields;
  if (showOnlyDiffs && !fields.length) {
    return null;
  }
  return (
    <FormSection title={title} sectionActions={sectionActions}>
      <Grid container sx={{ alignItems: "start" }} size={12}>
        {fields.map((name, index) => (
          <CompareField
            key={name}
            name={name}
            options={schema[name] ?? {}}
            index={index}
            groupIndex={groupIndex}
            hasDiff={diffFields.has(name)}
            compareFormMethods={compareFormMethods}
          />
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
  const [diffFields, setDiffFields] = useState(() => new Set());
  const {
    formContext: { setValue, getValues },
  } = useFormManagerContext();
  const formData = getValues();

  const compareFormMethods = useForm({});
  const compareId = inputData?.record_id;

  const mergeBlankValues = () => {
    for (const key of diffFields) {
      const compareValue = compareFormMethods.getValues(key);
      const prevValue = getValues(key);
      if (compareValue != null && (prevValue == null || prevValue === "")) {
        setValue(key, compareValue, {
          shouldValidate: true,
          shouldDirty: true,
        });
      }
    }
  };

  useEffect(() => {
    if (inputData) {
      const currentData = getDefaultValuesFromSchema(service, getValues());
      // Only compare fields that exist in the current record
      const compareData = Object.fromEntries(
        Object.entries(getDefaultValuesFromSchema(service, inputData)).filter(([key]) => key in currentData),
      );
      compareFormMethods.reset(inputData);
      setDiffFields(compareObjects(currentData, compareData));
    }
  }, [inputData, service, compareFormMethods, getValues]);

  if (loading) {
    return null;
  }

  const sections = fields.map((section, groupIndex) => (
    <CompareFormSection
      key={section.title || groupIndex}
      showOnlyDiffs={showOnlyDiffs}
      schema={schema}
      groupIndex={groupIndex}
      diffFields={diffFields}
      compareFormMethods={compareFormMethods}
      {...section}
    />
  ));

  return (
    <Stack direction="column" spacing={2}>
      <Paper sx={{ p: 2 }}>
        Compare the current record in the left column with the record values in the right column. Use the
        <KeyboardDoubleArrowLeft sx={{ verticalAlign: "middle", mx: 0.5 }} />
        button to replace values in the left column with those from the right.
        <br />
        <FormControlLabel
          control={<Switch checked={showOnlyDiffs} onChange={(e) => setShowOnlyDiffs(e.target.checked)} />}
          label="Only show fields with differences"
        />
        <Show unless={versions}>
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
        <DataCard title={formData?.title} data={formData} route="/admin/records" id={id} align="left" />
        {!hideSwap && (
          <Tooltip title="Swap comparison">
            <Link to={`/admin/site/find-duplicates/${compareId}/${id}`}>
              <Button variant="outlined" size="small">
                <SwapHoriz />
              </Button>
            </Link>
          </Tooltip>
        )}
        <DataCard title={inputData?.title} data={inputData} route="/admin/records" id={compareId} />
      </Stack>
      {sections}
      <FormSection title="Media">
        <CompareMediaSection
          compareData={inputData}
          compareFormMethods={compareFormMethods}
          showOnlyDiffs={showOnlyDiffs}
          groupIndex={fields.length}
        />
      </FormSection>
    </Stack>
  );
};

export default CompareForm;
