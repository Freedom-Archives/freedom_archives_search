import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Grid from "@mui/material/Grid";
import MenuItem from "@mui/material/MenuItem";
import Tooltip from "@mui/material/Tooltip";
import { merge } from "lodash-es";
import { memo, useCallback, useMemo, useState } from "react";
import { AutocompleteElement, FormProvider, useForm, useFormContext } from "react-hook-form-mui";
import { useAutocompleteOptions } from "src/components/Autocomplete/useAutoCompleteOptions";

import { services } from "../../api";
import FieldRow from "../FieldRow";
import { Field } from "../form/Field";

import searchTypes from "./searchTypes"; // Move it out of main file

const emptyArray = [];

const Wrapper = ({ showTooltip, currentValue, labelField, getOptionById, children }) => {
  if (!showTooltip) return <>{children}</>;
  const currentOption = getOptionById(currentValue) || currentValue;
  return (
    <Tooltip title={currentOption && currentOption[labelField]} arrow>
      <span>{children}</span>
    </Tooltip>
  );
};

export const NewListItemDialog = ({ label, service, handleClose, value, createParams }) => {
  // const [listItem, setListItem] = useState({});
  const cancel = () => {
    handleClose(null);
  };

  return (
    <Dialog open={value !== null} onClose={cancel} aria-labelledby="form-Dialog-title">
      {value && <NewListItemForm {...{ label, service, value, createParams, cancel, handleClose }} />}
    </Dialog>
  );
};

const NewListItemForm = ({ label, service, value, createParams, cancel, handleClose }) => {
  const defaultValues = { value };
  const methods = useForm({
    defaultValues,
    mode: "onSubmit",
    reValidateMode: "onBlur",
  });

  const { handleSubmit } = methods;

  const onSave = async ({ value }) => {
    const result = await services[service].create({
      item: value,
      ...createParams,
    });
    handleClose(result);
  };

  const validateItem = useCallback(
    async (item) => {
      const { data } = await services.list_items.find({
        query: {
          item,
          ...createParams,
        },
      });
      if (data.length) {
        return `A ${label.toLowerCase()} named "${item}" already exists`;
      }
    },
    [label, createParams],
  );

  const handleSubmitWithoutPropagation = (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleSubmit(onSave)(e);
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmitWithoutPropagation} autoComplete="off" noValidate>
        <Grid size={12} sx={{ width: 300 }}>
          <DialogTitle id="form-dialog-title">Create a new {label.toLowerCase()}</DialogTitle>
          <DialogContent>
            <FieldRow>
              <Field
                name="value"
                label=""
                rules={{
                  validate: validateItem,
                }}
              />
            </FieldRow>
          </DialogContent>
          <DialogActions>
            <Button onClick={cancel} color="primary">
              Cancel
            </Button>
            <Button type="submit" color="primary">
              Add
            </Button>
          </DialogActions>
        </Grid>
      </form>
    </FormProvider>
  );
};

const Autocomplete = ({
  name,
  label,
  textFieldProps,
  options: staticOptions,
  autocompleteProps: _autocompleteProps,
  expandOptions = false,
  // autocompleteProps: {
  //   helperText: _helperText,
  //   inputProps: _inputProps,
  //   renderOption: customRenderOption,
  //   ...defaultAutocompleteProps
  // } = {},
  value,
  onChange: customOnChange,
  helperText,
  isRHF = false,
  service = "default",
  searchParams,
  createParams,
  fetchAll = false,
  create = false,
  clearOnSelect = false,
  returnFullObject = true,
  excludeIds = emptyArray,
  disableClearable = false,
  showTooltip = false,
  inputRef,
  ...props
}) => {
  const typeLabel = useMemo(() => (label || "").replace(/s$/, "").toLowerCase(), [label]);
  const {
    helperText: _helperText,
    inputProps: _inputProps,
    renderOption: customRenderOption,
    ...defaultAutocompleteProps
  } = useMemo(() => _autocompleteProps || {}, [_autocompleteProps]);

  const { getValues, setValue } = useFormContext() || {};
  const currentValue = useMemo(() => (isRHF && getValues ? getValues(name) : value), [isRHF, getValues, name, value]);
  const { loading, options, labelField, idField, getOptionById, fetchOptions, setOptions } = useAutocompleteOptions({
    typeLabel,
    service,
    searchParams: useMemo(() => searchParams, [searchParams]),
    staticOptions: useMemo(() => staticOptions, [staticOptions]),
    excludeIds: useMemo(() => excludeIds, [excludeIds]),
    isMulti: props.multiple,
    value: currentValue,
    fetchAll,
    returnFullObject,
    create,
  });

  const [customValue, setCustomValue] = useState(null);
  const [hasInteracted, setHasInteracted] = useState(false);

  const renderOption = useCallback(
    (props, val) => {
      if (val == null) return null;
      const option = getOptionById(val);
      if (!option) {
        return null;
      }
      if (customRenderOption) {
        return customRenderOption(props, option);
      }
      const renderOption = searchTypes[service]?.renderOption || ((item) => item[labelField]);
      if (option?.hidden || !option?.[idField]) {
        return null;
      }
      return (
        <MenuItem {...props} key={option[idField]}>
          {option[idField] === "new" ? (
            <i>
              Create new {typeLabel} "<b>{option.searchTerm}</b>"
            </i>
          ) : (
            renderOption(option)
          )}
        </MenuItem>
      );
    },
    [getOptionById, customRenderOption, service, idField, typeLabel, labelField],
  );

  const handleOpen = () => {
    if (!hasInteracted && !staticOptions) {
      fetchOptions(""); // trigger default search
      setHasInteracted(true);
    }
  };

  const onChange = useCallback(
    async (e, _value) => {
      let value = _value;
      if (value != null) {
        if (returnFullObject) {
          if (props.multiple) {
            value = value.map((item) => getOptionById(item) || item);
          } else {
            value = getOptionById(value) || value;
          }
        } else {
          value = props.multiple ? value.map((v) => getOptionById(v)?.[idField]) : getOptionById(value)?.[idField];
        }
      }
      if (props.multiple && Array.isArray(value)) {
        value = value.filter((item) => (returnFullObject ? item?.[idField] : item) !== "new");
      } else if (!props.multiple && (returnFullObject ? value?.[idField] : value) === "new") {
        value = null;
      }

      customOnChange && customOnChange(value);

      if (clearOnSelect) {
        setTimeout(() => {
          logger.log("onChange", value, clearOnSelect);
          setValue(name, null);
          setOptions([]);
        });
      }
    },
    [
      customOnChange,
      clearOnSelect,
      returnFullObject,
      props.multiple,
      getOptionById,
      idField,
      setValue,
      name,
      setOptions,
    ],
  );

  const autocompleteProps = merge(
    {
      handleHomeEndKeys: true,
      filterSelectedOptions: true,
      disableCloseOnSelect: false,
      disableClearable,
      clearOnBlur: true,
      blurOnSelect: false,
      onChange,
      disabled: props.disabled,
      autoHighlight: true,
      // autoSelect: true,
      getOptionLabel: (option) => {
        const label = (getOptionById(option) || option)?.[labelField] || "NO LABEL";
        return label;
      },
      onInputChange: (e, value, reason) => {
        if (reason === "input" && !staticOptions && !(fetchAll && options?.length)) {
          fetchOptions(value);
        }
      },
      slotProps: {
        paper: {
          style: {
            width: expandOptions ? "fit-content" : null,
          },
          sx: {
            "& .MuiAutocomplete-option": {
              whiteSpace: expandOptions ? "nowrap" : "wrap",
            },
          },
        },
      },
      renderOption,
      onOpen: handleOpen,
    },
    defaultAutocompleteProps,
    { size: textFieldProps.size },
  );

  if (!staticOptions && !fetchAll) {
    autocompleteProps.filterOptions = (x) => x;
  }

  return (
    <>
      <Wrapper
        showTooltip={showTooltip}
        currentValue={currentValue}
        labelField={labelField}
        getOptionById={getOptionById}
      >
        <AutocompleteElement
          name={name}
          label={label}
          options={options}
          textFieldProps={textFieldProps}
          autocompleteProps={autocompleteProps}
          helperText={helperText}
          loading={loading}
          {...props}
          transform={{
            input: (value) => {
              let returnValue = value ?? null;
              if (props.multiple) {
                returnValue = Array.isArray(value) ? value : emptyArray;
              }

              return returnValue;
            },
            output: (_, value) => {
              if (!props.multiple) {
                const option = getOptionById(value) ?? value;
                if (option?.[idField] === "new") {
                  setCustomValue(option.searchTerm);
                  return {};
                }
                return value;
              }
              if (!Array.isArray(value)) return emptyArray;
              const lastItem = value[value.length - 1];
              const option = getOptionById(lastItem) ?? lastItem;

              if (option?.[idField] === "new") {
                setCustomValue(option.searchTerm);
                value = value.slice(0, -1);
              }
              if (!staticOptions && !(fetchAll && options?.length)) {
                fetchOptions("");
              }
              return [...new Set(value.filter((item) => (getOptionById(item) ?? item)?.[idField] !== "new"))];
            },
          }}
        />
      </Wrapper>
      <NewListItemDialog
        handleClose={(result) => {
          setCustomValue(null);
          if (result) {
            const updatedValue = props.multiple ? [...getValues(name), result] : result;
            setValue(name, updatedValue, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
          }
        }}
        service={service}
        label={typeLabel}
        value={customValue}
        createParams={createParams}
        multiple={props.multiple}
      />
    </>
  );
};

export default memo(Autocomplete);
