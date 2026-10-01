import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import { useCallback, useState } from "react";
import { useFormContext } from "react-hook-form";
import ButtonLink from "src/components/ButtonLink";
import useFormManagerContext from "src/components/form/FormManagerContext";

// Base FormButton component that accepts handlers from context wrappers

const STATICFORMCONTEXT = { formState: {} };
const emptyObject = {};
export const FormButton = ({
  label,
  onClick,
  type,
  formName,
  deleteOptions = emptyObject,
  icon,
  deleteHandler,
  saveHandler,
  formContext = STATICFORMCONTEXT,
  ...props
}) => {
  const [loading, setLoading] = useState(false);
  const { handleSubmit, formState: {} = {} } = formContext || {};

  const click = useCallback(
    async (e) => {
      setLoading(true);
      try {
        if (type === "submit") {
          e.preventDefault();
          if (saveHandler) {
            await saveHandler();
            onClick && await onClick();
          } else {
            await handleSubmit(onClick)();
          }
        } else if (onClick) {
          await onClick();
        } else if (type === "delete" && deleteHandler) {
          await deleteHandler(deleteOptions);
        }
      } finally {
        setLoading(false);
      }
    },
    [type, onClick, deleteHandler, saveHandler, handleSubmit, deleteOptions],
  );

  if (type === "link") {
    return <ButtonLink
      variant="contained"
      size="medium"
      startIcon={icon}
      {...props}
    >
      {label}
    </ButtonLink>;
  }

  return (
    <Button
      loading={loading}
      loadingPosition="start"
      variant="contained"
      size="medium"
      onClick={click}
      form={formName}
      startIcon={icon}
      // disabled={type === "submit" && !isValid && isSubmitted}
      type={type === "submit" ? "submit" : "button"}
      {...props}
    >
      {label}
    </Button>
  );
};

export const FormManagerButton = (props) => {
  const { confirmDelete, formContext, submitForm } = useFormManagerContext();
  return <FormButton {...props} saveHandler={submitForm} deleteHandler={confirmDelete} formContext={formContext} />;
};

export const ReactHookFormButton = (props) => {
  const formContext = useFormContext();
  return <FormButton {...props} formContext={formContext} />;
};

export function ButtonsHeader({ buttons, useFormManager = true, ...props }) {
  if (!buttons?.length) {
    return null;
  }

  const ButtonComponent = useFormManager ? FormManagerButton : ReactHookFormButton;
  return (
    <Grid container className="buttons" spacing={1} justifyContent="flex-end" {...props}>
      {buttons.map((props) => (
        <ButtonComponent key={props.label || props.id} {...props} />
      ))}
    </Grid>
  );
}

export default ButtonsHeader;
