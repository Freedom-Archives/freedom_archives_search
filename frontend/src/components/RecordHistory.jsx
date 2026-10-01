import ArrowBack from "@mui/icons-material/ArrowBack";
import Save from "@mui/icons-material/Save";
import { Alert, AlertTitle, LinearProgress, List, ListItem, ListItemButton, ListItemText, Paper } from "@mui/material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { Grid } from "@mui/system";
import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { version_history } from "src/api";
import { BaseForm } from "src/components/form/BaseForm";
import ViewContainer from "src/components/ViewContainer";
import { recordSelectFields } from "src/config/constants";
import { useTitle } from "src/stores";

import CompareForm from "./CompareForm";
import Show from "./Show";

const schema = {
  title: {},
  description: { field_type: "textarea" },
  is_hidden: { field_type: "checkbox" },
  needs_review: { field_type: "checkbox" },
  authors: { multiple: true, field_type: "list_item", itemType: "author" },
  producers: { multiple: true, field_type: "list_item", itemType: "producer" },
  keywords: { multiple: true, field_type: "list_item", itemType: "keyword" },
  subjects: { multiple: true, field_type: "list_item", itemType: "subject" },
  collection: { field_type: "editableItem", service: "collections" },
  vol_number: {},
  program: { field_type: "list_item", itemType: "program" },
  publishers: { multiple: true, field_type: "list_item", itemType: "publisher" },
  location: {},
  date_string: {
    field_type: "datestring",
    label: "Date",
    helperText: "MM/DD/YYYY format - enter '00' for unknown day or month",
  },
  year_is_circa: { field_type: "checkbox", label: "Approximate Date" },
  fact_number: {},
  notes: { field_type: "textarea" },
};

const fields = [
  {
    fields: Object.keys(schema),
  },
];

const RecordHistory = () => {
  const [version, setVersion] = useState({});
  const [versions, setVersions] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { id, version_index } = useParams();

  const fetchVersions = useCallback(async () => {
    setLoading(true);
    const versions = await version_history.find({ query: { item_id: id, type: "record", $sort: { date: 1 } } });
    console.log(versions);
    
    setVersions(versions.map((v, version_index) => ({ version_index, ...v })));
  }, [id]);

  useEffect(() => {
    fetchVersions();
  }, [id, fetchVersions]);

  useEffect(() => {
    if (versions?.length > 0 && !version_index) {
      const latestVersionId = versions.at(-1)?.version_index;
      navigate({ pathname: `${latestVersionId}` }, { relative: "route", replace: true });
    }
  }, [versions, version_index, navigate, id]);

  useEffect(() => {
    setLoading(versions === null);
    setVersion(versions?.[version_index || 0] || {});
  }, [versions, version_index]);

  const sideNav = (
    <Paper variant="outlined">
      <Typography variant="h6" sx={{ px: 2, py: 0 }}>
        History
      </Typography>
      <List dense sx={{ maxHeight: "60vh", overflowY: "auto" }}>
        {versions?.toReversed()?.map((version) => (
          <ListItem key={version.version_index} disableGutters disablePadding>
            <ListItemButton
              dense
              selected={version.version_index === Number(version_index)}
              component={Link}
              to={`../${version.version_index}`}
              relative="path"
            >
              <ListItemText
                primary={new Date(version.date).toLocaleString()}
                secondary={version.contributor_name || "Unknown"}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Paper>
  );

  return (
    <CompareRecord
      version={version}
      id={id}
      reloadData={fetchVersions}
      missingMessage={"No changes found"}
      sideNav={sideNav}
      loading={loading}
    />
  );
};

export const CompareRecord = ({ id, version, headerElements, reloadData, missingMessage, sideNav, loading }) => {
  const setTitle = useTitle();
  const [loadingSave, setLoadingSave] = useState(false);
  const { version_index } = useParams();

  const backToRecordPath = version_index !== undefined ? "../.." : `..`;

  return (
    <Box className="flex-container">
      <BaseForm
        formConfig={{
          service: "records",
          id: id,
          namePath: "title",
          fetchOptions: {
            query: {
              $select: recordSelectFields,
            },
          },
          onFetch: (record) => {
            setTitle(record?.title);
            return record;
          },
        }}
      >
        {({ submitForm }) => {
          return (
            <ViewContainer
              service="records"
              noPaper
              buttons={[
                {
                  label: "Return to Record",
                  type: "link",
                  icon: <ArrowBack />,
                  variant: "outlined",
                  to: backToRecordPath,
                  relative: "path",
                },
                {
                  label: "Save Changes",
                  color: "primary",
                  icon: <Save />,
                  loading: loadingSave,
                  onClick: async () => {
                    setLoadingSave(true);
                    try {
                      await submitForm();
                      await reloadData();
                    } finally {
                      setLoadingSave(false);
                    }
                  },
                },
              ]}
              headerElements={headerElements}
            >
              <Show when={loading}>
                <LinearProgress />
              </Show>
              <Show unless={loading}>
                <Show when={!version?.date}>
                  <Box sx={{ p: 2 }}>
                    <Alert severity="info" sx={{ mb: 2 }}>
                      <AlertTitle>{missingMessage}</AlertTitle>
                      <Button
                        variant="contained"
                        startIcon={<ArrowBack />}
                        to={backToRecordPath}
                        relative="path"
                        // href={`/admin/records/${id}`}
                        component={Link}
                      >
                        Back to Record
                      </Button>
                    </Alert>
                  </Box>
                </Show>
                <Show when={!!version?.date}>
                  <Grid container direction="row" spacing={2}>
                    <Grid size="auto">{sideNav}</Grid>
                    <Grid size={sideNav ? "grow" : 12}>
                      <CompareForm
                        id={id}
                        compareData={version.data}
                        fields={fields}
                        schema={schema}
                        service="records"
                        hideSwap={true}
                        versions={true}
                      />
                    </Grid>
                  </Grid>
                </Show>
              </Show>
            </ViewContainer>
          );
        }}
      </BaseForm>
    </Box>
  );
};

export default RecordHistory;
