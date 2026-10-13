import KeyboardDoubleArrowLeft from "@mui/icons-material/KeyboardDoubleArrowLeft";
import SwapHoriz from "@mui/icons-material/SwapHoriz";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { getServiceID } from "src/api";
import CompareMediaSection from "src/components/Compare/CompareMediaSection";
import useFormManagerContext from "src/components/form/FormManagerContext";
import Link from "src/components/Link";
import Show from "src/components/Show";

import CompareListSection from "./CompareListSection";
import { CompareField, CompareFieldsSection, CompareHeader } from "./CompareSharedComponents";
import { getFieldDiffs } from "./CompareUtils";

// Compares the item in the surrounding form (left column) with compareData (right column), with controls to copy
// values from the right into the form. For a read-only comparison of two saved versions, see CompareVersions.
//   config: the item type's entry in COMPARE_CONFIG
//   versions: compareData is a saved version of the item, rather than another item (duplicates)
const CompareForm = ({ compareData: inputData, config, loading, id, hideSwap = false, versions = false }) => {
  const { service, schema, fields, label, hasMedia, relationLists = [] } = config;
  const itemLabel = label.toLowerCase();
  const route = `/admin/${service}`;
  const [showOnlyDiffs, setShowOnlyDiffs] = useState(true);
  const [diffFields, setDiffFields] = useState(() => new Set());
  const {
    formContext: { setValue, getValues },
  } = useFormManagerContext();
  const formData = getValues();

  const compareFormMethods = useForm({});
  const compareId = inputData?.[getServiceID(service)];

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
      compareFormMethods.reset(inputData);
      setDiffFields(getFieldDiffs(service, schema, getValues(), inputData));
    }
  }, [inputData, service, schema, compareFormMethods, getValues]);

  if (loading) {
    return null;
  }

  // Comparing with a saved version restores its values; comparing with another item (duplicates) replaces them
  const copyTooltip = versions
    ? "Restore this value from the right column"
    : "Replace current value with value from right column";

  const sections = fields.map((section, groupIndex) => (
    <CompareFieldsSection
      key={section.title || groupIndex}
      title={section.title}
      sectionActions={section.sectionActions}
      fields={section.fields}
      diffFields={diffFields}
      showOnlyDiffs={showOnlyDiffs}
      renderField={(name, index) => (
        <CompareField
          key={name}
          name={name}
          options={schema[name] ?? {}}
          index={index}
          groupIndex={groupIndex}
          hasDiff={diffFields.has(name)}
          compareFormMethods={compareFormMethods}
          tooltip={copyTooltip}
        />
      )}
    />
  ));

  return (
    <Stack direction="column" spacing={2}>
      <CompareHeader
        intro={
          <>
            Compare the current {itemLabel} in the left column with the {itemLabel} values in the right column. Use the
            <KeyboardDoubleArrowLeft sx={{ verticalAlign: "middle", mx: 0.5 }} />
            button to {versions ? "restore" : "replace"} values in the left column with those from the right.
          </>
        }
        showOnlyDiffs={showOnlyDiffs}
        setShowOnlyDiffs={setShowOnlyDiffs}
        controls={
          <Show unless={versions}>
            <Tooltip title="Update all empty values in the left column with non-empty values from the right column">
              <span>
                <Button variant="outlined" onClick={mergeBlankValues} disabled={diffFields.size === 0}>
                  Merge Blank Values
                </Button>
              </span>
            </Tooltip>
          </Show>
        }
        left={{ title: formData?.title, data: formData, route, id }}
        right={{ title: inputData?.title, data: inputData, route, id: compareId }}
        between={
          !hideSwap && (
            <Tooltip title="Swap comparison">
              <Link to={`/admin/site/find-duplicates/${compareId}/${id}`}>
                <Button variant="outlined" size="small">
                  <SwapHoriz />
                </Button>
              </Link>
            </Tooltip>
          )
        }
      />
      {sections}
      {hasMedia && (
        <CompareMediaSection
          compareData={inputData}
          compareFormMethods={compareFormMethods}
          showOnlyDiffs={showOnlyDiffs}
          groupIndex={fields.length}
          copyTooltip={copyTooltip}
          versions={versions}
        />
      )}
      {relationLists.map((list) => (
        <CompareListSection key={list.name} compareData={inputData} showOnlyDiffs={showOnlyDiffs} {...list} />
      ))}
    </Stack>
  );
};

export default CompareForm;
