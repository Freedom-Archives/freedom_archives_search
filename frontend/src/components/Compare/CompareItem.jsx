import ArrowBack from "@mui/icons-material/ArrowBack";
import Save from "@mui/icons-material/Save";
import { Alert, AlertTitle, LinearProgress, List, ListItem, ListItemButton, ListItemText, Paper } from "@mui/material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { Grid } from "@mui/system";
import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import { snapshots, version_history } from "src/api";
import { BaseForm } from "src/components/form/BaseForm";
import Show from "src/components/Show";
import ViewContainer from "src/components/ViewContainer";
import { useTitle } from "src/stores";

import { COMPARE_CONFIG } from "./compareConfig";
import CompareForm from "./CompareForm";

// Compare the current item with a saved version. type is a key of COMPARE_CONFIG (record, collection)
export const CompareItem = ({ type, id, version, headerElements, reloadData, missingMessage, sideNav, loading }) => {
  const config = COMPARE_CONFIG[type];
  const { service, label, selectFields } = config;
  const setTitle = useTitle();
  const [loadingSave, setLoadingSave] = useState(false);
  const { version_index } = useParams();

  const backToItemPath = version_index !== undefined ? "../.." : `..`;

  return (
    <Box className="flex-container">
      <BaseForm
        formConfig={{
          service,
          id,
          namePath: "title",
          fetchOptions: {
            query: {
              $select: selectFields,
            },
          },
          onFetch: (item) => {
            setTitle(item?.title);
            return item;
          },
        }}
      >
        {({ submitForm }) => {
          return (
            <ViewContainer
              service={service}
              noPaper
              buttons={[
                {
                  label: `Return to ${label}`,
                  type: "link",
                  icon: <ArrowBack />,
                  variant: "outlined",
                  to: backToItemPath,
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
                      await reloadData?.();
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
                <Show when={!version?.version_id}>
                  <Box sx={{ p: 2 }}>
                    <Alert severity="info" sx={{ mb: 2 }}>
                      <AlertTitle>{missingMessage}</AlertTitle>
                      <Button
                        variant="contained"
                        startIcon={<ArrowBack />}
                        to={backToItemPath}
                        relative="path"
                        component={Link}
                      >
                        Back to {label}
                      </Button>
                    </Alert>
                  </Box>
                </Show>
                <Show when={!!version?.version_id}>
                  <Grid container direction="row" spacing={2}>
                    <Grid size="auto">{sideNav}</Grid>
                    <Grid size={sideNav ? "grow" : 12}>
                      <CompareForm id={id} compareData={version.data} config={config} hideSwap={true} versions={true} />
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

// Browse the saved versions of an item, comparing each with the current item
export const ItemHistory = ({ type }) => {
  const [version, setVersion] = useState({});
  const [versions, setVersions] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { id, version_index } = useParams();
  const { pathname } = useLocation();

  const fetchVersions = useCallback(async () => {
    setLoading(true);
    const versions = await version_history.find({ query: { item_id: id, type, $sort: { superseded_at: 1 } } });

    setVersions(versions.map((v, version_index) => ({ version_index, ...v })));
  }, [id, type]);

  useEffect(() => {
    setVersions(null);

    fetchVersions();
  }, [id, fetchVersions]);

  useEffect(() => {
    const hasNavigated = window.location.pathname !== pathname;
    if (versions?.length > 0 && !version_index && !hasNavigated) {
      const latestVersionId = versions.at(-1)?.version_index;
      navigate({ pathname: `${latestVersionId}` }, { relative: "route", replace: true });
    }
  }, [versions, version_index, navigate, id, pathname]);

  useEffect(() => {
    setLoading(versions === null);
    setVersion(versions?.[version_index] || versions?.at(-1) || {});
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
              {/* Each version is the item as last modified at data.date_modified, until the edit that superseded it */}
              <ListItemText
                primary={new Date(version.data?.date_modified).toLocaleString()}
                secondary={
                  <>
                    {version.data?.contributor_name || "Unknown"}
                    <br />
                    <Typography component="span" variant="caption" color="text.secondary">
                      Replaced {new Date(version.superseded_at).toLocaleString()} by{" "}
                      {version.superseded_by_name || version.superseded_by || "Unknown"}
                    </Typography>
                  </>
                }
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Paper>
  );

  return (
    <CompareItem
      type={type}
      version={version}
      id={id}
      reloadData={fetchVersions}
      missingMessage={"No changes found"}
      sideNav={sideNav}
      loading={loading}
    />
  );
};

// Compare the current item with its version as of the last site publish
export const ItemReview = ({ type }) => {
  const [version, setVersion] = useState({});
  const [lastPublishDate, setLastPublishDate] = useState(null);
  const [loading, setLoading] = useState(false);
  const { id } = useParams();

  useEffect(() => {
    const fetchPublishedVersion = async () => {
      setLoading(true);
      try {
        const snapshot = await snapshots.find({ query: { $sort: { date_published: -1 }, $limit: 1 } });
        const date_published = snapshot?.[0]?.date_published;
        setLastPublishDate(date_published ? new Date(date_published) : null);
        if (!date_published) {
          return;
        }

        // Each version is the item's state before an edit, so the state that was published is the one superseded
        // by the first edit after the publish
        const versions = await version_history.find({
          query: {
            item_id: id,
            type,
            superseded_at: {
              $gt: date_published,
            },
            $sort: { superseded_at: 1 },
            $limit: 1,
          },
        });
        if (versions?.length > 0) {
          setVersion(versions[0]);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchPublishedVersion();
  }, [id, type]);

  return (
    <CompareItem
      type={type}
      version={version}
      id={id}
      missingMessage={
        lastPublishDate
          ? `No changes since last publish date (${lastPublishDate.toLocaleString()}) found`
          : "The site has not been published yet"
      }
      loading={loading}
    />
  );
};
