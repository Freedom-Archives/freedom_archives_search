import ArrowBack from "@mui/icons-material/ArrowBack";
import Save from "@mui/icons-material/Save";
import { Alert, AlertTitle, LinearProgress, List, ListItem, ListItemButton, ListItemText, Paper } from "@mui/material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { Grid } from "@mui/system";
import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import { getServiceID, services, snapshots, version_history } from "src/api";
import { BaseForm } from "src/components/form/BaseForm";
import Show from "src/components/Show";
import ViewContainer from "src/components/ViewContainer";
import { useTitle } from "src/stores";

import { COMPARE_CONFIG } from "./compareConfig";
import CompareForm from "./CompareForm";
import CompareVersions from "./CompareVersions";

// Show a change to an item: the saved version before it (older) compared with the state after it (newer). When
// newer is null, the state after the change is the current item, which is loaded into an editable form so values
// can be restored from the older version. Otherwise both are saved versions, compared read-only.
//   type: a key of COMPARE_CONFIG (record, collection)
export const CompareItem = ({ type, id, older, newer, headerElements, reloadData, missingMessage, sideNav, loading }) => {
  const config = COMPARE_CONFIG[type];
  const { service, label, selectFields } = config;
  const setTitle = useTitle();
  const [loadingSave, setLoadingSave] = useState(false);
  const { version_id } = useParams();
  const editable = !newer;

  const backToItemPath = version_id !== undefined ? "../.." : `..`;

  // The editable form sets the title when it loads the item; read-only comparisons look it up
  useEffect(() => {
    if (!editable) {
      services[service]
        .get(id, { query: { $select: [getServiceID(service), "title"] } })
        .then((item) => setTitle(item?.title));
    }
  }, [editable, service, id, setTitle]);

  const returnButton = {
    label: `Return to ${label}`,
    type: "link",
    icon: <ArrowBack />,
    variant: "outlined",
    to: backToItemPath,
    relative: "path",
  };

  const renderContent = (comparison) => (
    <>
      <Show when={loading}>
        <LinearProgress />
      </Show>
      <Show unless={loading}>
        <Show when={!older?.version_id}>
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
        <Show when={!!older?.version_id}>
          <Grid container direction="row" spacing={2}>
            <Grid size="auto">{sideNav}</Grid>
            <Grid size={sideNav ? "grow" : 12}>{comparison}</Grid>
          </Grid>
        </Show>
      </Show>
    </>
  );

  if (!editable) {
    return (
      <Box className="flex-container">
        <ViewContainer noPaper buttons={[returnButton]} headerElements={headerElements}>
          {renderContent(<CompareVersions config={config} id={id} newer={newer.data} older={older?.data} />)}
        </ViewContainer>
      </Box>
    );
  }

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
        {({ submitForm }) => (
          <ViewContainer
            service={service}
            noPaper
            buttons={[
              returnButton,
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
            {renderContent(
              <CompareForm id={id} compareData={older?.data} config={config} hideSwap={true} versions={true} />,
            )}
          </ViewContainer>
        )}
      </BaseForm>
    </Box>
  );
};

// Browse the changes made to an item, most recent first. Each change is a saved version (the item before the
// change) compared with the state after it: the next version, or for the most recent change, the current item.
// Changes are addressed by the version_id of the version before them.
export const ItemHistory = ({ type }) => {
  const [versions, setVersions] = useState(null);
  const navigate = useNavigate();
  const { id, version_id } = useParams();
  const { pathname } = useLocation();

  const fetchVersions = useCallback(async () => {
    const versions = await version_history.find({ query: { item_id: id, type, $sort: { superseded_at: 1 } } });
    setVersions(versions);
    return versions;
  }, [id, type]);

  useEffect(() => {
    setVersions(null);
    fetchVersions();
  }, [id, fetchVersions]);

  // Links to a change, relative to the current route (which may not include a version_id yet)
  const changePath = (versionId) => (version_id !== undefined ? `../${versionId}` : `${versionId}`);

  // Open the most recent change by default
  useEffect(() => {
    const hasNavigated = window.location.pathname !== pathname;
    if (versions?.length > 0 && version_id === undefined && !hasNavigated) {
      navigate({ pathname: `${versions.at(-1).version_id}` }, { relative: "route", replace: true });
    }
  }, [versions, version_id, navigate, pathname]);

  const selectedIndex = versions?.findIndex((version) => String(version.version_id) === version_id) ?? -1;
  const olderIndex = selectedIndex >= 0 ? selectedIndex : (versions?.length ?? 0) - 1;
  const older = versions?.[olderIndex];
  const newer = versions?.[olderIndex + 1] ?? null;

  // After saving the most recent change, a new change has been made: show it
  const reloadAndShowLatest = async () => {
    const latest = (await fetchVersions()).at(-1);
    if (latest) {
      navigate(changePath(latest.version_id), { relative: "path" });
    }
  };

  const sideNav = (
    <Paper variant="outlined">
      <Typography variant="h6" sx={{ px: 2, py: 0 }}>
        History
      </Typography>
      <List dense sx={{ maxHeight: "60vh", overflowY: "auto" }}>
        {versions?.toReversed()?.map((version) => (
          <ListItem key={version.version_id} disableGutters disablePadding>
            <ListItemButton
              dense
              selected={version.version_id === older?.version_id}
              component={Link}
              to={changePath(version.version_id)}
              relative="path"
            >
              {/* The change was made at superseded_at, replacing this version */}
              <ListItemText
                primary={new Date(version.superseded_at).toLocaleString()}
                secondary={version.superseded_by_name || version.superseded_by || "Unknown"}
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
      older={older}
      newer={newer}
      id={id}
      reloadData={reloadAndShowLatest}
      missingMessage={"No changes found"}
      sideNav={sideNav}
      loading={versions === null}
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
      older={version}
      newer={null}
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
