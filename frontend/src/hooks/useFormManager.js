import dayjs from "dayjs";
import { isEmpty, startCase } from "lodash-es";
import { useConfirm } from "material-ui-confirm";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form-mui";
import { getDefaultValuesFromSchema } from "src/components/form/schemaUtils";
import { useAddNotification, useDisplayError } from "src/stores";

import { services } from "../api";

import validators from "./validators";
// import { useAddNotification, useDisplayError } from "../appContext";

const getChangedFields = (input, dirtyFields) => {
  if (!dirtyFields || typeof dirtyFields !== "object") {
    return input;
  }

  const checkValue = (value) => {
    return value === true || checkArray(value) || checkObject(value);
  };

  const checkObject = (object) => {
    return (
      object &&
      typeof object === "object" &&
      Object.keys(object).some((key) => {
        return checkValue(object[key]);
      })
    );
  };
  const checkArray = (array) => {
    return (
      Array.isArray(array) &&
      array.some((item) => {
        return checkValue(item);
      })
    );
  };
  return Object.keys(dirtyFields).reduce((acc, key) => {
    if (key in input) {
      if (checkValue(dirtyFields[key])) {
        acc[key] = input[key];
      }
    }
    return acc;
  }, {});
};
const defaultTransformInput = (input) => input;

function useFormManager({
  namePath = "name",
  service,
  transformInput = defaultTransformInput,
  onFetch,
  id,
  skipUpdatedCheck,
  onUpdate,
  onDelete,
  onCreate,
  formContextProps,
  skipDirtyCheck,
  defaultValues: inputDefaultValues = {},
  fetchOptions,
} = {}) {
  const [entityData, setEntityData] = useState({});
  const [loading, setLoading] = useState({ init: true, delete: false, update: false, create: false, fetch: false });
  const confirm = useConfirm();
  const initialMountRef = useRef(true);
  logger.log("FORM MANAGER RENDER");

  const fetchEntity = useCallback(
    async (id) => {
      setLoading((l) => ({ ...l, fetch: true }));
      const result = await services[service].get(id, (fetchOptions || {}));
      setLoading((l) => ({ ...l, fetch: false }));
      return result;
    },
    [service, fetchOptions],
  );

  const processData = useCallback(
    async (result, init = false) => {
      const result_data = isEmpty(result) ? result : getDefaultValuesFromSchema(service, result);
      logger.log("RESULT", result, init, result_data);
      setEntityData(result_data);
      const data = onFetch ? await onFetch(result_data) : result_data;
      setFormData(data);
      setRetrieveTime(dayjs(data?.date_updated));
      // const transformedData = transformData(data, schema, init);
      // logger.log({ result, init, data, transformedData });
      return data;
    },
    [onFetch, service],
  );

  const formConfig = useMemo(
    () => ({
      reValidateMode: "onBlur",
      mode: "onSubmit",
      defaultValues: async () => {
        const data = id == null || !services[service] ? inputDefaultValues : await fetchEntity(id);
        const defaultValues = await processData(getDefaultValuesFromSchema(service, data));
        // logger.log("DEFAULTS", defaultValues);
        setLoading((l) => ({ ...l, init: false }));
        return defaultValues;
      },
      resolver: async (data, context, options) => {
        // logger.log("Resolver called with:", {
        //   data,
        //   context,
        //   options,
        //   isInitialMount: initialMountRef.current,
        //   // isSubmitted: formState.isSubmitted,
        //   // isDirty: formState.isDirty,
        //   // isValidating: formState.isValidating,
        //   // touchedFields: Object.keys(formState.touchedFields),
        //   // dirtyFields: Object.keys(formState.dirtyFields),
        //   // eventType: options?.originalEvent?.type, // This might help identify the trigger
        // });
        const valdationResult = await validators[`${service}Validator`](data, context, options);
        if (!isEmpty(valdationResult.errors)) {
          logger.log("VALIDATION RESULT", valdationResult, data);
        }
        // const errors = Object.keys(valdationResult.errors);
        // if (errors.length > 0) {
        //   const message = errors.map((key) => `${key}: ${JSON.stringify(valdationResult.errors[key])}`);
        //   // console.error(message.join("\n"));
        //   // displayError(message.join("\n"));
        // }
        return valdationResult;
      },
      ...(formContextProps || {}),
    }),
    [formContextProps, id, service, inputDefaultValues, fetchEntity, processData],
  );

  const context = useForm(formConfig);
  // After the first render, set initialMount to false
  useEffect(() => {
    if (initialMountRef.current) {
      initialMountRef.current = false;
    }
  }, []);

  const { formState, reset, trigger, handleSubmit, getValues } = context;
  const [retrieveTime, setRetrieveTime] = useState(null);
  const [formData, setFormData] = useState({});
  const resetPromiseRef = useRef(null);
  const displayError = useDisplayError();
  const addNotification = useAddNotification();
  const serviceDisplayName = service.replace(/s$/, "");
  const hasDirtyFields = Object.keys(formState.dirtyFields).length > 0;

  const getDisplayName = useCallback(() => {
    return getValues(namePath) || "";
  }, [getValues, namePath]);

  const stats = useMemo(
    () => ({
      created: formData?.date_created && dayjs(formData.date_created),
      updated: formData?.date_updated && dayjs(formData.date_updated),
    }),
    [formData?.date_created, formData?.date_updated],
  );

  // Move all the existing form management functions here
  const resetForm = useCallback(
    async (result) => {
      const values = await processData(result);
      reset(values, { keepErrors: false, keepDirty: false, keepDefaultValues: false });
      if (!formState.isDirty) {
        return values;
      }
      // Create a Promise that resolves when formState.isDirty becomes false
      const waitForReset = new Promise((resolve) => {
        // if (!formState.isDirty) {
        //   resolve()
        // } else {
        resetPromiseRef.current = resolve;
        // }
      });
      // Wait for next tick for form state to settle
      await new Promise((r) => setTimeout(r, 0));
      // if (formState.isDirty) {
      //   console.error("Form is still dirty after reset + tick");
      // }
      // Await the Promise
      await waitForReset;
      return values;
    },
    [reset, processData, formState.isDirty],
  );

  const notifyAction = useCallback(
    (action) => {
      const display_name = getDisplayName();
      const message = display_name
        ? `${startCase(serviceDisplayName)} "${display_name}" ${action}`
        : `${startCase(service)} ${action}`;
      logger.log(message);
      addNotification({
        message,
      });
    },
    [serviceDisplayName, getDisplayName, addNotification, service],
  );

  const updateEntity = useCallback(
    async (id, data) => {
      setLoading((l) => ({ ...l, update: true }));
      try {
        logger.log("SAVE!!!", id, data);
        const result = await services[service].patch(id, data, { noDispatchError: true });
        notifyAction("updated");
        logger.log("RESULT", result);
        const processed = await resetForm(result);
        onUpdate && (await onUpdate(processed));
      } catch (error) {
        console.error(error);
        displayError(error, `Error updating ${serviceDisplayName}`);
      }
      setLoading((l) => ({ ...l, update: false }));
    },
    [service, notifyAction, resetForm, onUpdate, displayError, serviceDisplayName],
  );

  const createEntity = useCallback(
    async (data) => {
      setLoading((l) => ({ ...l, create: true }));
      try {
        const result = await services[service].create(data, { noDispatchError: true });
        notifyAction("created");
        const processed = await resetForm(result);
        onCreate && (await onCreate(processed));
      } catch (error) {
        console.error(error);
        displayError(error, `Error creating ${serviceDisplayName}`);
      }
      setLoading((l) => ({ ...l, create: false }));
    },
    [service, notifyAction, resetForm, onCreate, displayError, serviceDisplayName],
  );

  const deleteEntity = useCallback(
    async (id) => {
      setLoading((l) => ({ ...l, delete: true }));
      try {
        const result = await services[service].remove(id, { noDispatchError: true });
        notifyAction("deleted");
        const processed = await resetForm(result);
        onDelete && (await onDelete(processed));
      } catch (error) {
        console.error(error);
        displayError(error, `Error deleting ${serviceDisplayName}`);
      }
      setLoading((l) => ({ ...l, delete: false }));
    },
    [service, notifyAction, resetForm, onDelete, displayError, serviceDisplayName],
  );

  useEffect(() => {
    if (!formState.isDirty && resetPromiseRef.current) {
      resetPromiseRef.current();
      resetPromiseRef.current = null;
    }
  }, [formState.isDirty]);

  const confirmDelete = useCallback(
    async (deleteOptions = {}) => {
      const display_name = getDisplayName();
      const { renderContent, getDeleteParams, onConfirm, ...customConfirmOptions } = deleteOptions;

      onConfirm && onConfirm();
      const confirmOptions = {
        title: `Confirm Delete`,
        description: `Are you sure you want to delete the ${serviceDisplayName} "${display_name}"?`,
        confirmationButtonProps: { color: "error" },
        ...customConfirmOptions,
      };

      if (renderContent) {
        confirmOptions.content = renderContent(entityData);
      }
      await new Promise((resolve) => setTimeout(resolve, 0));
      try {
        const { confirmed } = await confirm(confirmOptions);
        if (!confirmed) {
          throw new Error("User cancelled the deletion");
        }
        const params = getDeleteParams?.() || {};
        logger.log("DELETE", id, params);
        await deleteEntity(id);
      } catch (error) {
        if (error?.message?.includes("User cancelled the deletion")) {
          logger.log("User cancelled the deletion");
        } else {
          console.error("Error confirming delete:", error);
        }
        return false;
      }
    },
    [confirm, deleteEntity, getDisplayName, entityData, id, serviceDisplayName],
  );

  const onSave = useCallback(
    async (input) => {
      const { dirtyFields } = formState;
      logger.log("SAVE!", input);
      // logger.log({ dirtyFields });

      if (id == null && Object.keys(input).length === 0) {
        displayError("No data to save");
        return;
      }
      const changedFields = id != null ? getChangedFields(input, dirtyFields) : input;
      if (Object.keys(dirtyFields).length === 0) {
        displayError("No changes to save");
        return;
      }
      logger.log("CHANGED", changedFields, dirtyFields);
      const transformedInput = await transformInput(changedFields, getValues());
      logger.log("TRANSFORMED", transformedInput);
      if (id != null) {
        if (!skipUpdatedCheck) {
          const { date_modified, contributor_name, contributor_username } = await fetchEntity(id);
          logger.log("CURRENT", { date_modified, contributor_name, contributor_username, retrieveTime });
          const currentTime = dayjs(date_modified);
          // logger.log(currentTime.format(), retrieveTime.format());
          if (currentTime > retrieveTime) {
            displayError(
              React.createElement(
                "span",
                null,
                "Unable to save your changes. This record was updated by ",
                React.createElement("b", null, contributor_name || contributor_username),
                " on ",
                React.createElement("b", null, currentTime?.format("LLLL")),
                " after you began editing. Please refresh the page to view the latest version and manually reapply your changes.",
              ),
            );
            return false;
          }
        }
        await updateEntity(id, transformedInput);
      } else {
        await createEntity(transformedInput);
      }
      return true;
    },
    [
      getValues,
      createEntity,
      updateEntity,
      id,
      displayError,
      fetchEntity,
      formState,
      transformInput,
      retrieveTime,
      skipUpdatedCheck,
    ],
  );

  const submitForm = useCallback(() => {
    return handleSubmit(onSave)();
  }, [handleSubmit, onSave]);

  // console.log(formState.isDirty, formState.dirtyFields);
  return {
    service,
    formContext: context,
    formState,
    formData,
    stats,
    submitForm,
    confirmDelete,
    // display_name: getDisplayName(),
    retrieveTime,
    isLoading: Object.values(loading).some((x) => x),
    hasDirtyFields,
    loading,
    validate: trigger,
    reset: resetForm,
    shouldBlockNavigation: formState.isDirty && hasDirtyFields && !skipDirtyCheck,
  };
}

export { useFormManager };
