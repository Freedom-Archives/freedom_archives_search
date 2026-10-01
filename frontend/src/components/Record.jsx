import "./Record.scss";

import ExpandMore from "@mui/icons-material/ExpandMore";
import RadioButtonCheckedOutlined from "@mui/icons-material/RadioButtonCheckedOutlined";
import RadioButtonUncheckedOutlined from "@mui/icons-material/RadioButtonUncheckedOutlined";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import Icon from "@mui/material/Icon";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import React, { useCallback } from "react";
import { useFieldArray, useFormContext } from "react-hook-form-mui";
import { useNavigate, useParams } from "react-router";
import { records } from "src/api";
import { EditableItemsList, RecordsList } from "src/components/EditableItemsList";
// import ButtonsHeader from "src/components/form/ButtonsHeader";
import useFormManagerContext from "src/components/form/FormManagerContext";
import Show from "src/components/Show";
import Thumbnail from "src/components/Thumbnail";
import { recordSelectFields } from "src/config/constants";
import { useAddNotification, useTitle } from "src/stores";
import EditItemView from "src/views/EditItemView";

import FieldRow from "./FieldRow";
import { BaseForm } from "./form/BaseForm";
import { Field } from "./form/Field";
import GridBlock from "./GridBlock";
import Link from "./Link";
// import ViewContainer from "../components/ViewContainer";

// const defaultRecord = {
//   // date_string: "??/??/????",
//   // record_id: null,
//   // archive_id: null,
//   // title: null,
//   // description: null,
//   // notes: null,
//   // location: null,
//   // vol_number: null,
//   // collection_id: null,
//   // parent_record_id: null,
//   // primary_media_id: null,
//   // year: null,
//   // month: null,
//   // day: null,
//   // publisher_id: null,
//   // program_id: null,
//   // needs_review: false,
//   // is_hidden: false,
//   // publish_to_global: false,
//   // creator_user_id: null,
//   // contributor_user_id: null,
//   // date_created: null,
//   // date_modified: null,
//   // date_string: null,
//   // date: null,
//   publisher: {
//     item: null,
//     list_item_id: null,
//   },
//   program: {
//     item: null,
//     list_item_id: null,
//   },
//   media: [{}],
//   // has_digital: true,
//   // media_count: null,
//   // contributor_name: null,
//   // contributor_username: null,
//   // creator_name: null,
//   // creator_username: null,
//   call_numbers: [],
//   formats: [],
//   qualitys: [],
//   generations: [],
//   media_types: [],
//   authors: [],
//   subjects: [],
//   keywords: [],
//   producers: [],
//   // primary_media_thumbnail: null,
//   // primary_media_format: null,
//   // primary_media_format_text: null,
//   // primary_media_media_type: null,
//   collection: {},
//   children: [],
//   siblings: [],
//   parent: {},
//   continuations: [],
// };

export function MediaItem({ media, index, actions }) {
  const { swap, remove, update } = actions || {};
  if (!media) {
    return null;
  }
  const edit = !media.delete;

  return (
    <React.Fragment key={`${media.media_id}-${media.id}`}>
      <TableRow className={`media ${media.delete ? "deleted" : ""}`} style={{ verticalAlign: "top" }}>
        <TableCell className="media-action" sx={{ verticalAlign: "middle" }}>
          <IconButton
            sx={{ p: 1 }}
            onClick={() => {
              media.media_id ? update(index, { ...media, delete: !media.delete }) : remove(index);
            }}
            size="large"
          >
            <Icon>{media.delete ? "restore" : "delete"}</Icon>
          </IconButton>
        </TableCell>
        <TableCell sx={{ verticalAlign: "middle", textAlign: "center" }}>
          <IconButton onClick={() => swap(index, 0)} size="large" sx={{ p: 1 }}>
            {index === 0 ? <RadioButtonCheckedOutlined /> : <RadioButtonUncheckedOutlined />}
          </IconButton>
        </TableCell>
        <TableCell>
          <Grid container spacing={0}>
            <Grid size={7.5}>
              <Field
                field_type="list_item"
                itemType="call_number"
                ro={!edit}
                label="Class"
                name={`media.${index}.call_number_item`}
                textFieldProps={{
                  sx: {
                    "& .MuiInputBase-root": {
                      borderRadius: "var(--mui-shape-borderRadius) 0px 0px var(--mui-shape-borderRadius)",
                    },
                  },
                }}
                fetchAll
                fullWidth
                showTooltip
              />
            </Grid>
            <Grid size={4.5}>
              <Field
                ro={!edit}
                label="Suffix"
                name={`media.${index}.call_number_suffix`}
                sx={{
                  "& .MuiInputBase-root": {
                    borderRadius: "0px var(--mui-shape-borderRadius) var(--mui-shape-borderRadius) 0px",
                    marginLeft: "-1px",
                  },
                }}
              />
            </Grid>
          </Grid>
        </TableCell>
        <TableCell>
          <Field
            fetchAll
            field_type="list_item"
            itemType="generation"
            ro={!edit}
            label="Generation"
            name={`media.${index}.generation_item`}
            showTooltip
          />
        </TableCell>
        <TableCell>
          <Field
            fetchAll
            field_type="list_item"
            itemType="format"
            ro={!edit}
            label="Format"
            service="list_items"
            name={`media.${index}.format_item`}
            showTooltip
          />
        </TableCell>
        <TableCell>
          <Field
            fetchAll
            field_type="list_item"
            itemType="quality"
            ro={!edit}
            label="Quality"
            service="list_items"
            name={`media.${index}.quality_item`}
            showTooltip
          />
        </TableCell>
        <TableCell>
          <Field
            ro={!edit}
            type="number"
            inputProps={{ min: 0, style: { width: 40 } }}
            name={`media.${index}.no_copies`}
          />
        </TableCell>
      </TableRow>
      <TableRow className={media.delete ? "deleted" : ""}>
        <TableCell />
        <TableCell>
          {media.url && media.record_id && (
            <Link href={media.url} target="_blank" rel="noopener noreferrer">
              <Icon>open_in_new</Icon>
            </Link>
          )}
        </TableCell>
        <TableCell colSpan={6}>
          <Field ro={!edit} label="URL" name={`media.${index}.url`} />
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
}

export function Media({ record }) {
  const {
    control,
    formState: { errors },
  } = useFormContext();

  const { fields, ...actions } = useFieldArray({
    name: "media",
    control,
  });

  return (
    <>
      <Table size="small" className="media" sx={{ mb: 2, "td, th": { px: 1 } }}>
        <TableHead>
          <TableRow>
            <TableCell style={{ width: 50 }}></TableCell>
            <TableCell style={{ width: 60 }}>Primary</TableCell>
            <TableCell style={{ width: 220 }}>Call Number</TableCell>
            <TableCell>Generation</TableCell>
            <TableCell>Format</TableCell>
            <TableCell>Quality</TableCell>
            <TableCell style={{ width: 60 }}>Copies</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {fields.length === 0 && (
            <TableRow>
              <TableCell align="center" colSpan={15}>
                No Media
              </TableCell>
            </TableRow>
          )}
          {fields.map((media, index) => (
            <MediaItem key={media.id} media={media} index={index} actions={actions} />
          ))}
        </TableBody>
      </Table>
      <Box sx={{ color: "error.main" }}>{errors.media && errors.media.message}</Box>
      <Button
        variant="contained"
        onClick={() => actions.append({ record_id: record.id, no_copies: 1 })}
        startIcon={<Icon>add</Icon>}
      >
        Add New Media
      </Button>
    </>
  );
}

function Relationships({ id, relationships }) {
  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>Number</TableCell>
          <TableCell>Title</TableCell>
          {/* <TableCell>Generation</TableCell>
          <TableCell>Call No.</TableCell>
          <TableCell>Format</TableCell> */}
          <TableCell>Track</TableCell>
          {/* <TableCell>Type</TableCell> */}
          <TableCell>Link</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {(relationships || []).length === 0 && (
          <TableRow>
            <TableCell align="center" colSpan={15}>
              No Related Records
            </TableCell>
          </TableRow>
        )}
        {(relationships || []).map((relation, index) => {
          const side = relation.docid_1 === id ? 2 : 1;

          const doc_id = relation[`docid_${side}`];
          return (
            <React.Fragment
              key={relation.id}
              // key={`${relation.docid_1}_${relation.docid_2}_${relation.track_number_1}_${relation.track_number_2}`}
            >
              <TableRow>
                <TableCell rowSpan={2}>{index + 1}</TableCell>
                <TableCell>
                  <Link to={`/admin/record/${doc_id}`}> {relation[`title_${side}`]} </Link>
                </TableCell>
                {/* <TableCell>{relation[`generation_${side}`]}</TableCell> */}
                {/* <TableCell>{relation[`call_number_${side}`]}</TableCell> */}
                {/* <TableCell>{relation[`format_${side}`]}</TableCell> */}
                <TableCell>{relation[`track_number_${side}`]}</TableCell>
                {/* <TableCell>{relation.type}</TableCell> */}
                <TableCell>
                  <Link to={`/relationship/${relation.id}`}>View</Link>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={7}> {relation[`description_${side}`]} </TableCell>
              </TableRow>
            </React.Fragment>
          );
        })}
      </TableBody>
    </Table>
  );
}

function RecordParent() {
  return (
    <Grid container justifyContent="center" alignItems="center" spacing={4}>
      <Grid size={12}>
        <Field field_type="editableItem" service="records" name="parent" />
      </Grid>
    </Grid>
  );
}

function UpdateThumbnailButton({ setThumbnailSince }) {
  const {
    reset,
    formContext: { getValues },
  } = useFormManagerContext();

  const {
    record_id,
    media: [media],
  } = getValues();

  const thumbnailAvailable = Boolean(media?.url);

  const addNotification = useAddNotification();

  const forceThumbnailUpdate = useCallback(async () => {
    const { url, media_id } = media || {};
    if (!url || record_id == null || !media_id) return;
    const res = await records.patch(record_id, { media: [{ url, media_id }] });
    await reset(res);
    addNotification({ message: "Thumbnail updated" });
    setThumbnailSince(new Date().toISOString());
  }, [addNotification, media, record_id, reset, setThumbnailSince]);

  return (
    <Tooltip title={thumbnailAvailable ? "" : "No thumbnail available - first media item must have a URL"}>
      <span>
        <Button
          onClick={forceThumbnailUpdate}
          disabled={!thumbnailAvailable}
          variant="outlined"
          sx={{ width: "100px" }}
        >
          Update Thumbnail
        </Button>
      </span>
    </Tooltip>
  );
}

const fetchOptions = {
  query: {
    $select: recordSelectFields,
  },
};

export function Record({ id /*  embedded = false */ }) {
  const { id: paramId } = useParams();
  id ??= paramId;
  const navigate = useNavigate();
  const newRecord = id === "new";
  const [thumbnailSince, setThumbnailSince] = React.useState(null);

  const setTitle = useTitle();
  const onCreate = useCallback(
    ({ record_id }) => {
      navigate(`/admin/records/${record_id}`);
    }, [navigate],
  )

  const onFetch = useCallback(
    (record) => {
      setTitle(record.title || "New Record");
      if (!record.media || record.media.length === 0) {
        record.media = [{ no_copies: 1 }];
      }
      return record;
    },
    [setTitle],
  );

  const onDelete = useCallback(() => {
    navigate(`/admin/records`);
  }, [navigate]);

  logger.log("Record RENDER");
  return (
    <Box className="record scroll-container">
      <BaseForm
        formConfig={{
          service: "records",
          id: newRecord ? null : id,
          namePath: "title",
          onCreate,
          onFetch,
          onDelete,
          fetchOptions,
        }}
      >
        {(manager) => {
          const { formData: record } = manager;

          return (
            <>
              <EditItemView item={record} newItem={newRecord} service="records" noPaper>
                <Grid container spacing={2}>
                  <GridBlock title="" spacing={2}>
                    <Grid size={12}>
                      <Stack direction={"row"} spacing={2}>
                        <Grid container spacing={2} size="grow">
                          <Grid size={12}>
                            <Field name="title" />
                          </Grid>
                          <Grid size={12}>
                            <Field name="description" multiline rows={4} />
                          </Grid>
                        </Grid>
                        {
                          <Grid
                            container
                            size={"auto"}
                            className="record-thumbnail"
                            spacing={2}
                            direction={"column"}
                            alignItems={"center"}
                          >
                            <Show unless={newRecord}>
                              <Thumbnail item={record} width={100} since={thumbnailSince} />
                              <UpdateThumbnailButton setThumbnailSince={setThumbnailSince} />
                            </Show>
                          </Grid>
                        }
                      </Stack>
                    </Grid>
                    <FieldRow>
                      <Field field_type="checkbox" name="is_hidden" />
                      <Field field_type="checkbox" name="needs_review" />
                    </FieldRow>

                    <FieldRow>
                      <Field name="authors" multiple field_type="list_item" itemType="author" create />
                      <Field name="producers" multiple field_type="list_item" itemType="producer" create />
                    </FieldRow>
                    <FieldRow>
                      <Field name="keywords" multiple field_type="list_item" itemType="keyword" create />
                      <Field name="subjects" multiple field_type="list_item" itemType="subject" create />
                    </FieldRow>
                    <FieldRow>
                      <Field field_type="editableItem" service="collections" name="collection" />
                      <Field name="vol_number" />
                    </FieldRow>
                    <FieldRow>
                      <Field name="program" field_type="list_item" itemType="program" create />
                      <Field name="publishers" multiple field_type="list_item" itemType="publisher" create />
                    </FieldRow>
                    <FieldRow>
                      <Field name="location" />
                      <Grid container spacing={2} direction={"row"}>
                        <Grid size={6}>
                          <Field
                            name="date_string"
                            label="Date"
                            field_type="datestring"
                            helperText="MM/DD/YYYY format - enter '00' for unknown day or month"
                            fullWidth={false}
                          />
                        </Grid>
                        <Grid size={6}>
                          <Field name="year_is_circa" label="Approximate date" field_type="checkbox" />
                        </Grid>
                      </Grid>
                    </FieldRow>
                    <FieldRow>
                      <Field name="fact_number" label="Cloud Backup Reference ID (FACT)" />
                    </FieldRow>
                    <FieldRow>
                      <Field name="notes" multiline rows={4} />
                    </FieldRow>
                  </GridBlock>
                  <GridBlock title="Media">
                    <Media record={record} media={record.media || []} />
                  </GridBlock>
                  <Grid size={12}>
                    <Divider />
                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMore />}>
                        <Typography variant="h5">Relationships</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Grid container spacing={2}>
                          <GridBlock title="Parent Record">
                            <RecordParent record={record} parent={record.parent || {}} />
                          </GridBlock>
                          <GridBlock title="Child Records">
                            <EditableItemsList record={record} name="children" emptyText="No child records" add />
                          </GridBlock>
                          <GridBlock title="Sibling Records">
                            <RecordsList records={record.siblings} emptyText="No Sibling Records" />
                          </GridBlock>
                          <GridBlock title="Continuations">
                            <EditableItemsList
                              record={record}
                              name="continuations"
                              emptyText="No related continuations"
                              reorder={true}
                              add
                            />
                          </GridBlock>
                          <GridBlock title="Old Relationships">
                            <Relationships id={id} relationships={record.relationships} />
                          </GridBlock>
                        </Grid>
                      </AccordionDetails>
                    </Accordion>
                  </Grid>
                </Grid>
              </EditItemView>
            </>
          );
        }}
      </BaseForm>
    </Box>
  );
}

export default Record;
