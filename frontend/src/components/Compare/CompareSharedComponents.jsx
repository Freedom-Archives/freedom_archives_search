import KeyboardDoubleArrowLeft from "@mui/icons-material/KeyboardDoubleArrowLeft";
import Replay from "@mui/icons-material/Replay";
import { Button, Grid, Paper, Stack, Tooltip, Typography } from "@mui/material";
import { get } from "lodash-es";
import { FormProvider, useFormContext } from "react-hook-form";
import { Field } from "src/components/form/Field";

export const UndoableActionButton = ({
  isDirty,
  hasDiff = true,
  tooltip,
  onCopy,
  onRestore,
  children,
  size = "medium",
}) => {
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

export const FormSection = ({ title, sectionActions, children }) => {
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

const CompareRow = ({ children, isDirty, hasDiff, tooltip, onCopy, onRestore, hideAction = false }) => {
  return (
    <Grid container size={12} alignItems={"start"} spacing={2}>
      <Grid size="grow">{children[0]}</Grid>
      <Grid alignSelf={"center"} sx={{ visibility: hideAction ? "hidden" : "visible" }}>
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

// compareName is the field path in the comparison form, when it differs from name (e.g. array items at
// different indexes). Pass null for name or compareName to leave that column empty. disabled locks the current
// field and hides the copy action. tooltip describes the copy action.
export const CompareField = ({
  name,
  compareName = name,
  options,
  index,
  groupIndex,
  hasDiff,
  compareFormMethods,
  disabled = false,
  tooltip = "Replace current value with value from right column",
}) => {
  const { setValue, resetField, formState } = useFormContext();
  const isDirty = name ? get(formState.dirtyFields, name) : false;

  const handleCopyRight = () => {
    const compareValue = compareFormMethods.getValues(compareName);
    setValue(name, compareValue, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  return (
    <CompareRow
      isDirty={isDirty}
      hasDiff={hasDiff}
      tooltip={tooltip}
      onCopy={handleCopyRight}
      onRestore={() => resetField(name)}
      hideAction={!name || !compareName || disabled}
    >
      {name ? (
        <Field
          tabIndex={100 * (groupIndex + 1) + index}
          highlightDirty={true}
          name={name}
          {...options}
          disabled={disabled || options?.disabled}
          color={hasDiff ? "info" : null}
        />
      ) : null}
      {compareName ? (
        <FormProvider {...compareFormMethods}>
          <Field name={compareName} disabled={true} {...options} />
        </FormProvider>
      ) : null}
    </CompareRow>
  );
};
