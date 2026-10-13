import Add from "@mui/icons-material/Add";
import Delete from "@mui/icons-material/Delete";
import KeyboardArrowDown from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUp from "@mui/icons-material/KeyboardArrowUp";
import Restore from "@mui/icons-material/Restore";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import Icon from "@mui/material/Icon";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { startCase } from "lodash-es";
import React, { useState } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { Link, useNavigate } from "react-router";

import { Field } from "./form/Field";
import Thumbnail from "./Thumbnail";

export function RecordsList({ records, ...props }) {
  // logger.log(records, props);
  return <ItemsList type="record" items={records} {...props} />;
}

export function CollectionsList({ collections, ...props }) {
  return <ItemsList type="collection" items={collections} {...props} />;
}

export function ItemsList({ items, type, emptyText, itemAction, link = true, ...props }) {
  const ItemTag = type === "record" ? RecordItem : CollectionItem;
  emptyText = emptyText || `No ${startCase(type)}s Found`;
  // logger.log(items);
  return (
    <List>
      {!items?.length && <Typography sx={{ p: 2, textAlign: "center" }}>{emptyText}</Typography>}
      {(items || []).map((item, index) => (
        <React.Fragment key={item.id || item[`${type}_id`]}>
          <ItemTag
            itemAction={itemAction ? () => itemAction(index, item) : undefined}
            index={index}
            type={type}
            link={link}
            action={item.action}
            marker={item.marker}
            highlight={item.highlight}
            muted={item.muted}
            {...{ [type]: item }}
            {...props}
          />
          <Divider component="li" />
        </React.Fragment>
      ))}
    </List>
  );
}

const icons = {
  Delete,
  KeyboardArrowUp,
  KeyboardArrowDown,
  Restore,
};

function EditableItemsListAction({ icon, size = "small", ...props }) {
  const IconTag = icons[icon];
  return (
    <IconButton size={size} {...props}>
      <IconTag fontSize="inherit" />
    </IconButton>
  );
}

export function EditableItemsListBase({
  name,
  emptyText,
  reorder = false,
  type = "record",
  add,
  fields,
  append,
  move,
  update,
}) {
  const [showAdd, setShowAdd] = useState(false);
  const { getValues } = useFormContext();

  const items = fields.map((item, index) => {
    if (!item) {
      return null;
    }
    // logger.log(getValues(`${name}[${index}]`));
    const actions = [
      <EditableItemsListAction
        key="remove"
        onClick={() => {
          const currentValue = getValues(`${name}.${index}`);
          update(index, {
            ...currentValue,
            delete: !currentValue.delete,
          });
        }}
        // disabled={index === 0}
        icon={item.delete ? "Restore" : "Delete"}
        size={reorder ? "small" : "large"}
      />,
    ];
    if (reorder) {
      actions.unshift(
        <EditableItemsListAction
          key="up"
          onClick={() => move(index, index - 1)}
          disabled={index === 0}
          icon="KeyboardArrowUp"
        />,
      );
      actions.push(
        <EditableItemsListAction
          key="down"
          onClick={() => move(index, index + 1)}
          disabled={index === getValues(name).length - 1}
          icon="KeyboardArrowDown"
        />,
      );
    }
    item.action = () => (
      <Grid container direction="column">
        {actions}
      </Grid>
    );
    // logger.log(item);
    return item;
  });
  // logger.log("???", name, items);
  const addLabel = `Add ${name}`;

  const addField = showAdd ? (
    <Field
      name={`__new_${name}`}
      label={addLabel}
      field_type="select"
      service={`${type}s`}
      size="small"
      clearOnChange
      highlightDirty={false}
      managed
      excludeIds={[getValues(`${type}_id`), ...getValues(name).map((item) => item[`${type}_id`])]}
      onChange={(child) => {
        if (child) {
          append(child);
        }
      }}
      clearOnSelect
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <Add />
          </InputAdornment>
        ),
      }}
    />
  ) : (
    <>
      <Button onClick={() => setShowAdd(true)} startIcon={<Add />}>
        {addLabel}
      </Button>{" "}
    </>
  );
  // logger.log("???", name, items, type);

  return (
    <>
      {add && addField}
      {type === "record" ? (
        <RecordsList records={items} emptyText={emptyText} />
      ) : (
        <CollectionsList collections={items} emptyText={emptyText} />
      )}
    </>
  );
}
export function EditableItemsList({ name, emptyText, reorder = false, type = "record", add }) {
  const { fields, append, move, prepend, update } = useFieldArray({
    name, // unique name for your Field Array
  });
  return <EditableItemsListBase {...{ name, emptyText, reorder, type, add, fields, append, move, prepend, update }} />;
  // logger.log(fields, name);
}

function RecordItemDetails({ details, dense }) {
  const navigate = useNavigate();
  const navigateTo = (link) => (e) => {
    e.preventDefault();
    navigate(link);
  };
  const items = details.reduce((acc, { label, type, link }) => {
    if (label) {
      const item = (
        <Grid
          key={type}
          sx={{
            p: 1,
            paddingTop: 0,
            paddingBottom: 0,
            backgroundColor: "var(--mui-palette-action-hover)",
            borderRadius: 4,
            rowGap: 20,
            whiteSpace: "nowrap",
            flexWrap: "wrap",
          }}
          rowSpacing={1}
          columnSpacing={1}
        >
          {/* <KVChip keyName={type} value={label} /> */}
          <Typography color="textSecondary" variant="caption">
            {type}:&nbsp;
            <b> {label} </b>
            {link && !dense && (
              <Icon onClick={navigateTo(link)} color="primary" style={{ fontSize: "inherit" }}>
                launch
              </Icon>
            )}
          </Typography>
        </Grid>
      );
      // return acc === null ? [item] : [acc, item]
      return [...acc, item];
    } else {
      return acc;
    }
  }, []);

  return (
    <Stack
      direction="row"
      // divider={<Divider orientation="vertical" flexItem />}
      spacing={1}
      flexWrap={"wrap"}
      rowGap={0.5}
      columnGap={0.5}
    >
      {items}
    </Stack>
  );
}

export function Item({
  id,
  type,
  item,
  details,
  title,
  description,
  link,
  dense,
  action,
  marker,
  highlight,
  muted = false,
  missingRecordText = "None",
  index,
  onClick: onClickHandler,
  ...props
}) {
  // marker: shown under the thumbnail. highlight: palette color for the row background, as used for changed
  // fields. muted: greys out the thumbnail and text.
  const mutedSx = muted ? { opacity: 0.4 } : {};
  const list_item_props = {
    sx: {
      display: "flex",
      // px: 1,
      // py: 0,
      ".MuiListItemText-root": {
        // margin: 0,
      },
    },
  };
  let Container = Box;
  if ((link && id != null) || onClickHandler) {
    if (link && id != null) {
      list_item_props.component = Link;
      list_item_props.to = `/admin/${type}s/${id}`;
    }
    if (onClickHandler) {
      list_item_props.onClick = (e) => onClickHandler(index, e);
    }
    list_item_props.alignItems = "flex-start";
    list_item_props.dense = dense;
    Container = ListItemButton;
  } else {
    list_item_props.sx = { display: "flex", px: 2, py: 1 };
  }
  if (action) {
    props.secondaryAction = action();
  }

  return (
    <ListItem
      {...props}
      dense={dense}
      disablePadding
      alignItems="flex-start"
      sx={
        highlight
          ? {
              backgroundColor: `rgba(var(--mui-palette-${highlight}-lightChannel) / 0.1)`,
              outline: `1px solid var(--mui-palette-${highlight}-main)`,
              outlineOffset: "-1px",
              borderRadius: "var(--mui-shape-borderRadius)",
              overflow: "hidden",
              my: 0.5,
              ...props.sx,
            }
          : props.sx
      }
    >
      <Container {...list_item_props}>
        <ListItemAvatar style={{ minWidth: dense ? 35 : 65 }}>
          <Stack alignItems="center" spacing={0.5}>
            <Box sx={mutedSx}>
              <Thumbnail item={item} width={dense ? 20 : 50} />
            </Box>
            {marker}
          </Stack>
        </ListItemAvatar>
        <ListItemText
          sx={mutedSx}
          disableTypography
          primary={id != null ? title : missingRecordText}
          secondary={
            <>
              <RecordItemDetails details={details || []} dense={dense} />
              {description && (
                <Typography
                  variant="body2"
                  color="textSecondary"
                  style={{
                    marginTop: 4.9,
                    maxHeight: 100,
                    // overflowX: "auto"
                    overflow: "hidden",
                  }}
                  dangerouslySetInnerHTML={{
                    __html: description,
                  }}
                />
              )}
            </>
          }
        />
      </Container>

      {/* {action && <ListItemSecondaryAction>{action()}</ListItemSecondaryAction>} */}
    </ListItem>
  );
}

export default function RecordItem({ record, description: showDescription, itemAction, ...props }) {
  const {
    title,
    record_id,
    primary_media_format_text,
    collection: { title: collection_title, collection_id } = {},
    description,
    call_numbers = [],
  } = record || {};
  const details = [
    {
      type: "Collection",
      label: collection_title,
      link: `/admin/collections/${collection_id}`,
    },
    { type: "Format", label: primary_media_format_text },
    { type: "ID", label: record_id },
    { type: "Call Numbers", label: call_numbers?.join(", ") },
  ];
  if (itemAction) {
    props.onClick = () => itemAction(record || {});
  }
  return (
    <Item
      item={record || {}}
      id={record_id}
      details={details}
      title={title}
      description={showDescription && description}
      {...props}
      type="record"
    />
  );
}

export function CollectionItem({ collection, description: showDescription, itemAction, ...props }) {
  const { title, collection_id, summary, parent, call_number } = collection || {};
  const details = [
    { type: "ID", label: collection_id },
    { type: "Call Number", label: call_number },
  ];
  if (parent && parent.collection_id) {
    details.unshift({
      type: "Parent Collection",
      label: parent.title,
      link: `/admin/collections/${parent.collection_id}`,
    });
  }
  if (itemAction) {
    props.onClick = () => itemAction(collection || {});
  }
  return (
    <Item
      id={collection_id}
      item={collection || {}}
      title={title}
      description={showDescription && summary}
      details={details}
      {...props}
      type="collection"
    />
  );
}
