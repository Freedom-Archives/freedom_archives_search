import ArrowBack from "@mui/icons-material/ArrowBack";
import Block from "@mui/icons-material/Block";
import Merge from "@mui/icons-material/Merge";
import Save from "@mui/icons-material/Save";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { useConfirm } from "material-ui-confirm";
import React, { useEffect } from "react";
import { useNavigate } from "react-router";
import { duplicate_records, records } from "src/api";
import { COMPARE_CONFIG } from "src/components/Compare/compareConfig";
import CompareForm from "src/components/Compare/CompareForm";
import { BaseForm } from "src/components/form/BaseForm";
import { getDefaultValuesFromSchema } from "src/components/form/schemaUtils";
import ViewContainer from "src/components/ViewContainer";
import { recordSelectFields } from "src/config/constants";
import validators from "src/hooks/validators";
import { useAddNotification, useTitle } from "src/stores";
import { EditItemFooter } from "src/views/EditItemView";

const itemLink = (item = "") => {
  const [id_1, id_2] = (item || "").split("|");
  if (!id_1 || !id_2) return "";
  return `/admin/site/find-duplicates/${id_1}/${id_2}`;
};

const CompareRecords = ({ id1, id2 }) => {
  const [record2, setRecord2] = React.useState({});
  const setTitle = useTitle();
  const navigate = useNavigate();
  const addNotification = useAddNotification();
  const [loadingIgnore, setLoadingIgnore] = React.useState(false);
  const [loadingMerge, setLoadingMerge] = React.useState(false);
  const [loadingSave, setLoadingSave] = React.useState(false);
  const confirm = useConfirm();

  useEffect(() => {
    const fetchData = async () => {
      const record2 = await records.get(id2, { query: { $select: recordSelectFields } });
      setRecord2(record2);
    };
    fetchData();
  }, [id1, id2]);

  if (!id1 || !id2) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="h6">Invalid Record IDs for Comparison</Typography>
        <Button variant="contained" startIcon={<ArrowBack />} href="/admin/records">
          Back to Records
        </Button>
      </Box>
    );
  }

  return (
    <Box className="flex-container">
      <BaseForm
        formConfig={{
          service: "records",
          id: id1,
          namePath: "title",
          fetchOptions: {
            query: {
              $select: recordSelectFields,
            },
          },
          // fetchQuery: { $select: recordSelectFields },
          // onCreate: ({ record_id }) => navigate(`/admin/records/${record_id}`),
          onFetch: (record) => {
            setTitle(record?.title || "New Record");
            return record;
          },
          // onDelete: () => navigate(`/admin/records`),
          // defaultValues: {
          //   media: [{ no_copies: 1 }],
          // },
        }}
      >
        {({ formData, submitForm, formContext, reset }) => {
          return (
            <ViewContainer
              service="records"
              noPaper
              buttons={[
                {
                  label: "Save Record",
                  type: "submit",
                  color: "primary",
                  icon: <Save />,
                  loading: loadingSave,
                  onClick: async () => {
                    setLoadingSave(true);
                    try {
                      await submitForm();
                      // addNotification({ message: 'Record saved successfully' });
                    } finally {
                      setLoadingSave(false);
                    }
                  },
                },
                {
                  label: "Merge Records",
                  icon: <Merge />,
                  loading: loadingMerge,
                  onClick: async () => {
                    setLoadingMerge(true);
                    try {
                      const { values } = await validators[`recordsValidator`](formContext.getValues(), formContext, {});

                      const cleaned = getDefaultValuesFromSchema("records", values);
                      const { confirmed } = await confirm({
                        description:
                          "Are you sure you want to merge these duplicate records? This will update the current (left) record with any modified values, and delete the compared (right) record. This action cannot be undone.",
                      });
                      if (confirmed) {
                        const res = await duplicate_records.patch(`${id1}|${id2}`, cleaned);
                        await reset(res);
                        addNotification({ message: "Records merged successfully" });
                        // navigate('/admin/site/find-duplicates');
                      }
                    } finally {
                      setLoadingMerge(false);
                    }
                  },
                },
                {
                  label: "Mark as not duplicates",
                  icon: <Block />,
                  variant: "outlined",
                  onClick: async () => {
                    setLoadingIgnore(true);
                    const { confirmed } = await confirm({
                      description: "Are you sure you want to ignore these records from future duplicate searches?",
                    });
                    if (confirmed) {
                      await duplicate_records.remove(`${id1}|${id2}`);
                      addNotification({ message: "Duplicate record ignored" });
                      navigate("/admin/site/find-duplicates");
                    }
                    setLoadingIgnore(false);
                  },
                  loading: loadingIgnore,
                },
              ]}
              footerElements={EditItemFooter({
                service: "duplicate_records",
                item: formData,
                itemLink,
                hideMeta: true,
              })}
            >
              <CompareForm id={id1} compareData={record2} config={COMPARE_CONFIG.record} />
            </ViewContainer>
          );
        }}
      </BaseForm>
      {/* <Stack spacing={2} direction="row">
        <Record id={id1} embedded />
        <Record id={id2} embedded />
      </Stack> */}
    </Box>
  );
};

export default CompareRecords;
