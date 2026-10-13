import Add from "@mui/icons-material/Add";
import Delete from "@mui/icons-material/Delete";
import KeyboardDoubleArrowLeft from "@mui/icons-material/KeyboardDoubleArrowLeft";
import Replay from "@mui/icons-material/Replay";
import { Box, Button, Divider, FormControlLabel, Grid, Paper, Stack, Switch, Tooltip, Typography } from "@mui/material";
import { get } from "lodash-es";
import { FormProvider, useFormContext } from "react-hook-form";
import { Field } from "src/components/form/Field";
import Link from "src/components/Link";
import { RenderTime } from "src/views/EditItemView";

// A button that performs an action, and once it has been done (isDirty), becomes an undo button
export const UndoableActionButton = ({ isDirty, hasDiff = true, tooltip, onAction, onUndo, children, size = "medium" }) => {
  return isDirty ? (
    <Tooltip title="Undo">
      <span>
        <Button size={size} variant="outlined" onClick={onUndo} disabled={!hasDiff}>
          <Replay sx={{ fontSize: size === "small" ? "1.2rem" : "1.5rem" }} />
        </Button>
      </span>
    </Tooltip>
  ) : (
    <Tooltip title={tooltip}>
      <Button size={size} variant="outlined" onClick={onAction}>
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

const ITEM_ACTIONS = {
  // Bring back an item that was removed since the comparison version
  restore: { Icon: Add, label: "Restore" },
  // Remove an item that was added since the comparison version
  remove: { Icon: Delete, label: "Remove" },
  // Put a changed item back to its comparison version
  revert: { Icon: KeyboardDoubleArrowLeft, label: "Restore" },
};

// An undoable action on one item of a compared list (a related record or collection, or a media item)
//   action: restore, remove or revert
//   label: overrides the action's button text
export const ItemActionButton = ({ action, label, isDirty, onAction, onUndo, tooltip }) => {
  const { Icon, label: defaultLabel } = ITEM_ACTIONS[action];
  return (
    <UndoableActionButton isDirty={isDirty} tooltip={tooltip} onAction={onAction} onUndo={onUndo} size="small">
      <Icon fontSize="small" sx={{ mr: 0.5 }} />
      {label ?? defaultLabel}
    </UndoableActionButton>
  );
};

// A section comparing a set of items (related records/collections, or media): a summary of the changes, an optional
// undoable "Restore all", and the items (children).
//   summary: e.g. "2 added · 1 removed"
//   note: shown after the summary, highlighted as an unsaved change
//   restoreAll: { isDirty, onAction, onUndo, tooltip, label }
export const CompareChangesSection = ({ title, summary, note, restoreAll, children }) => (
  <FormSection
    title={title}
    sectionActions={
      restoreAll && (
        <UndoableActionButton
          isDirty={restoreAll.isDirty}
          tooltip={restoreAll.tooltip}
          onAction={restoreAll.onAction}
          onUndo={restoreAll.onUndo}
          size="small"
        >
          <KeyboardDoubleArrowLeft />
          {restoreAll.label ?? "Restore all"}
        </UndoableActionButton>
      )
    }
  >
    <Typography variant="body2" color="text.secondary">
      {summary}
      {note && (
        <Typography component="span" variant="body2" color="success.main">
          {" "}
          · {note}
        </Typography>
      )}
    </Typography>
    {children}
  </FormSection>
);

// A section of compared fields. With showOnlyDiffs, only the fields in diffFields are shown, and the section is
// hidden if there are none. renderField(name, index) renders each field's row.
export const CompareFieldsSection = ({ title, sectionActions, fields, diffFields, showOnlyDiffs, renderField }) => {
  const shown = showOnlyDiffs ? fields.filter((name) => diffFields.has(name)) : fields;
  if (showOnlyDiffs && !shown.length) {
    return null;
  }
  return (
    <FormSection title={title} sectionActions={sectionActions}>
      <Grid container sx={{ alignItems: "start" }} size={12}>
        {shown.map(renderField)}
      </Grid>
    </FormSection>
  );
};

// A left/right pair of fields (children), with an optional action (e.g. a copy button) between them
const CompareRow = ({ children, action, hideAction = false }) => {
  return (
    <Grid container size={12} alignItems={"start"} spacing={2}>
      <Grid size="grow">{children[0]}</Grid>
      {action && (
        <Grid alignSelf={"center"} sx={{ visibility: hideAction ? "hidden" : "visible" }}>
          {action}
        </Grid>
      )}
      <Grid size="grow">{children[1]}</Grid>
    </Grid>
  );
};

// Fields have no read-only mode, only disabled, which fades them. This shows disabled fields at full strength. The
// doubled "&&" raises the selectors' specificity above MUI's own disabled styles.
const UNFADED_DISABLED_SX = {
  "&& .Mui-disabled": {
    color: "var(--mui-palette-text-primary)",
    WebkitTextFillColor: "var(--mui-palette-text-primary)",
    opacity: 1,
  },
  "&& .MuiFormLabel-root.Mui-disabled": {
    color: "var(--mui-palette-text-secondary)",
    WebkitTextFillColor: "var(--mui-palette-text-secondary)",
  },
};

// A read-only pair of fields, each bound to its own form (e.g. two saved versions of an item). The left field is
// shown at full strength; the right one is faded, as in the editable comparison.
export const StaticCompareField = ({ name, compareName = name, options, hasDiff, leftForm, rightForm }) => (
  <CompareRow>
    {name ? (
      <Box sx={UNFADED_DISABLED_SX}>
        <FormProvider {...leftForm}>
          <Field name={name} {...options} disabled={true} highlightDirty={false} color={hasDiff ? "info" : null} />
        </FormProvider>
      </Box>
    ) : null}
    {compareName ? (
      <FormProvider {...rightForm}>
        <Field name={compareName} {...options} disabled={true} highlightDirty={false} />
      </FormProvider>
    ) : null}
  </CompareRow>
);

// Title, link and created/modified details for one side of a comparison
const DataCard = ({ title, data, route, id, align = "right" }) => {
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
};

// The top of a comparison: an explanation (intro), the "Only show fields with differences" switch and any other
// controls, then a card for each side, with anything to show between them (between)
//   left, right: DataCard props
export const CompareHeader = ({ intro, showOnlyDiffs, setShowOnlyDiffs, controls, left, right, between }) => (
  <>
    <Paper sx={{ p: 2 }}>
      {intro}
      <br />
      <FormControlLabel
        control={<Switch checked={showOnlyDiffs} onChange={(e) => setShowOnlyDiffs(e.target.checked)} />}
        label="Only show fields with differences"
      />
      {controls}
    </Paper>
    <Stack direction={"row"} spacing={2} alignItems="center" sx={{ justifyContent: "space-between" }}>
      <DataCard {...left} align="left" />
      {between}
      <DataCard {...right} />
    </Stack>
  </>
);

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
      action={
        <UndoableActionButton
          isDirty={isDirty}
          hasDiff={hasDiff}
          tooltip={tooltip}
          onAction={handleCopyRight}
          onUndo={() => resetField(name)}
        >
          <KeyboardDoubleArrowLeft />
        </UndoableActionButton>
      }
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
