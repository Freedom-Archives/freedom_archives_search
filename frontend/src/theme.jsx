import { createTheme } from "@mui/material/styles";
import { startCase } from "lodash-es";

const xSmallFontSize = "0.7rem";
const xSmallPadding = "2px 3px";
const xSmallMinHeight = "28px";
const xSmallGroupPadding = "6px";
const xSmallInputFontSize = "0.9rem";
const xSmallAutocompleteInputPadding = "2.5px 4px 2.5px 8px";

const xSmallButtonStyles = {
  padding: xSmallPadding,
  fontSize: xSmallFontSize,
  lineHeight: 1.5,
  minHeight: xSmallMinHeight,
  minWidth: "56px",
  "& .MuiButton-startIcon, & .MuiButton-endIcon": {
    margin: 0,
  },
  "& svg": {
    fontSize: "1.2rem",
  },
};

const xSmallGroupButtonStyles = {
  ...xSmallButtonStyles,
  padding: xSmallGroupPadding,
  minWidth: 0,
};

const xSmallInputStyles = {
  "& .MuiInput-root.MuiInput-underline": {
    marginTop: 0,
  },
  "& .MuiInputBase-input": {
    fontSize: xSmallInputFontSize,
    padding: "6px 8px",
  },
  "& .MuiInputBase-input.MuiSelect-select, & .MuiInputBase-input.MuiAutocomplete-input": {
    padding: xSmallAutocompleteInputPadding,
  },
  "& .MuiInputBase-adornedStart": { paddingLeft: "8px" },
  "& .MuiInputBase-inputAdornedStart": { paddingLeft: 0 },
  "& .MuiInputBase-adornedEnd": { paddingRight: "8px" },
  "& .MuiInputBase-inputAdornedEnd": { paddingRight: 0 },
  "& svg": {
    fontSize: "1.2rem",
  },
  "& .MuiFormControlLabel-label": {
    fontSize: xSmallInputFontSize,
  },
  "& .MuiInputLabel-root": {
    fontSize: xSmallInputFontSize,
    transform: "translate(10px, 7px) scale(1)",
    "&.MuiInputLabel-shrink": {
      transform: "translate(13px, -9px) scale(0.75)",
    },
  },
};

const baseTheme = createTheme();

export const theme = createTheme(baseTheme, {
  cssVariables: {
    colorSchemeSelector: "class",
  },
  // colorSchemes: {
  //   dark: true,
  // },
  palette: {
    publicPrimary: baseTheme.palette.augmentColor({
      color: {
        main: "#920000",
      },
      name: "publicPrimary",
    }),
  },
  // cssVariables: true,
  typography: {
    h1: { fontSize: "2.5rem" },
    h2: { fontSize: "2.2rem" },
    h3: { fontSize: "1.9rem" },
    h4: { fontSize: "1.6rem" },
    h5: { fontSize: "1.4rem" },
    h6: { fontSize: "1.2rem" },
  },
  components: {
    MuiFormControlLabel: {
      variants: [
        {
          props: { size: "x-small" },
          style: xSmallInputStyles,
        },
      ],
    },
    MuiCheckbox: {
      variants: [
        {
          props: { size: "x-small" },
          style: xSmallGroupButtonStyles,
        },
      ],
    },
    MuiButton: {
      defaultProps: {
        size: "small",
      },
      variants: [
        {
          props: { size: "x-small" },
          style: xSmallButtonStyles,
        },
      ],
    },
    MuiIconButton: {
      defaultProps: {
        size: "small",
      },
      variants: [
        {
          props: { size: "x-small" },
          style: xSmallGroupButtonStyles,
        },
      ],
    },
    MuiButtonGroup: {
      variants: [
        {
          props: { size: "x-small" },
          style: {
            "& .MuiButton-root": xSmallGroupButtonStyles,
          },
        },
      ],
    },
    MuiToggleButtonGroup: {
      variants: [
        {
          props: { size: "x-small" },
          style: {
            "& .MuiToggleButton-root": xSmallGroupButtonStyles,
          },
        },
      ],
    },
    MuiToggleButton: {
      variants: [
        {
          props: { size: "x-small" },
          style: xSmallButtonStyles,
        },
      ],
    },
    MuiInputBase: {
      variants: [
        {
          props: { size: "x-small" },
          style: xSmallInputStyles,
        },
      ],
    },
    MuiTextField: {
      defaultProps: {
        size: "small",
      },
      variants: [
        {
          props: { size: "x-small" },
          style: xSmallInputStyles,
        },
      ],
    },
    MuiAutocomplete: {
      variants: [
        {
          props: { size: "x-small" },
          style: {
            // Combined class beats MUI's `& .MuiOutlinedInput-root { padding: 9 }` (1 child class)
            "& .MuiAutocomplete-inputRoot.MuiOutlinedInput-root": {
              padding: "4px",
              "& .MuiAutocomplete-input": {
                padding: xSmallAutocompleteInputPadding,
              },
            },
            ...xSmallInputStyles,
          },
        },
      ],
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          padding: "10px",
        },
      },
      defaultProps: {},
    },
    MuiFormControl: {
      variants: [
        {
          props: { size: "x-small" },
          style: xSmallInputStyles,
        },
      ],

      styleOverrides: {
        root: {
          ...["success", "warning", "info", "error"].reduce((acc, color) => {
            const colorName = `color${startCase(color)}`;
            const style = {
              [`& .MuiFormLabel-${colorName}`]: {
                color: `var(--mui-palette-${color}-main)`,
              },
              [`&:has(.MuiCheckbox-${colorName}).MuiFormControl-root`]: {
                width: "100%",
                outline: `1px solid var(--mui-palette-${color}-main)`,
                borderRadius: "2px",
                backgroundColor: `rgba(var(--mui-palette-${color}-lightChannel) / 0.1) !important`,
              },
              [`& .MuiCheckbox-${colorName}`]: {
                color: `var(--mui-palette-${color}-main)`,
              },
              [`& .MuiInputBase-${colorName}`]: {
                "&": {
                  backgroundColor: `rgba(var(--mui-palette-${color}-lightChannel) / 0.1) !important`,
                },
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: `var(--mui-palette-${color}-main)`,
                },
              },
            };

            return { ...acc, ...style };
          }, {}),
        },
      },
      // styleOverrides: {
      //   root: {
      //     "& .MuiFormLabel-colorSuccess": {
      //       color: "var(--mui-palette-success-main)", // Success color for default state
      //     },
      //     "&:has(.MuiCheckbox-colorSuccess).MuiFormControl-root": {
      //       width: "100%",
      //       outline: "1px solid var(--mui-palette-success-main)",
      //       borderRadius: "2px",
      //       backgroundColor:
      //         "rgba(var(--mui-palette-success-lightChannel) / 0.1) !important",
      //     },
      //     "& .MuiCheckbox-colorSuccess": {
      //       color: "var(--mui-palette-success-main)", // Success color for default state
      //     },
      //     "& .MuiInputBase-colorSuccess": {
      //       "&": {
      //         backgroundColor:
      //           "rgba(var(--mui-palette-success-lightChannel) / 0.1) !important",
      //       },
      //       "& .MuiOutlinedInput-notchedOutline": {
      //         borderColor: "var(--mui-palette-success-main)", // Success color for default state
      //       },
      //     },
      //     "& .MuiFormLabel-colorWarning": {
      //       color: "var(--mui-palette-warning-main)", // Success color for default state
      //     },
      //     "&:has(.MuiCheckbox-colorWarning).MuiFormControl-root": {
      //       width: "100%",
      //       outline: "1px solid var(--mui-palette-warning-main)",
      //       borderRadius: "2px",
      //       backgroundColor:
      //         "rgba(var(--mui-palette-warning-lightChannel) / 0.1) !important",
      //     },
      //     "& .MuiCheckbox-colorWarning": {
      //       color: "var(--mui-palette-warning-main)", // Success color for default state
      //     },
      //     "& .MuiInputBase-colorWarning": {
      //       "&": {
      //         backgroundColor:
      //           "rgba(var(--mui-palette-warning-lightChannel) / 0.1) !important",
      //       },
      //       "& .MuiOutlinedInput-notchedOutline": {
      //         borderColor: "var(--mui-palette-warning-main)", // Success color for default state
      //       },
      //     },
      //   },
      // },
    },
  },
});

// theme.palette.publicPrimary = theme.palette.augmentColor({
//   color: {
//     main: "#920000",
//   },
//   name: "publicPrimary",
// });
