import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import dayjs from "dayjs";
import { startCase } from "lodash-es";
import React, { lazy, useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form-mui";
import AutoSubmit from "src/components/AutoSubmit";
import Form from "src/components/form/Form";
import ViewContainer from "src/components/ViewContainer";
import { useDebouncedCallback } from "use-debounce";

import { collections, records, review_changes, snapshots } from "../api";
import { Field } from "../components/form/Field";
import Link from "../components/Link";

const EditableDataTable = lazy(() => import("../components/EditableDataTable"));

const defaultValues = {
  needs_review: true,
  date_modified: null,
  type: "all",
  action: "all",
  user_id: null,
  title: null,
  collection_id: null,
  changes_since: "published",
  since_amount: 10,
  since_unit: "days",
};

const createQuery = (filter, publishDate) => {
  const { title, needs_review, type, collection_id, action, user_id } = filter;
  const date_modified =
    filter.changes_since === "published" ? publishDate : dayjs().subtract(filter.since_amount, filter.since_unit);
  const query = {
    needs_review: needs_review ? needs_review : undefined,
    date_modified: date_modified ? { $gte: date_modified.format() } : undefined,
    type: type !== "all" ? type : undefined,
    action: action !== "all" ? action : undefined,
    collection_id: collection_id || undefined,
    contributor_user_id: user_id || undefined,
    title: title ? { $ilike: `%${title}%` } : undefined,
  };

  return query;
};

const initialOrder = [{ field: "date_modified", sort: "desc" }];
const initialPage = { skip: 0, limit: 15 };
const fields = [
  {
    name: "needs_review",
    field_type: "checkbox",
    label: "Only changes needing review",
    labelProps: { sx: { textAlign: "left", userSelect: "none" } },
  },
  {
    name: "date_modified",
  },
  { name: "title" },
  {
    name: "collection_id",
    label: "Collection",
    field_type: "select",
    returnFullObject: false,
    service: "collections",
  },

  {
    name: "user_id",
    label: "User",
    field_type: "select",
    returnFullObject: false,
    service: "users",
    fetchAll: true,
  },
  {
    name: "type",
    label: "Type",
    field_type: "select",
    returnFullObject: false,
    autocompleteProps: {
      disableClearable: true,
    },
    options: [
      { id: "all", label: "All" },
      { id: "collection", label: "Collection" },
      { id: "record", label: "Record" },
    ],
  },
  {
    name: "action",
    label: "Action",
    disableClearable: true,
    returnFullObject: false,
    field_type: "select",
    options: [
      { id: "all", label: "All" },
      { id: "create", label: "Create" },
      { id: "update", label: "Update" },
    ],
  },
];

const ReviewChangesForm = React.memo(function ({ setFilter, publishDate }) {
  const formContext = useForm({
    defaultValues,
    mode: "onChange",
  });

  const { getValues } = formContext;

  const customLabel = (
    <Stack direction={"row"} spacing={1} alignItems="center" justifyContent={"space-between"}>
      <Grid size={4} sx={{ maxWidth: "100px" }}>
        <Field
          field_type="number"
          name="since_amount"
          margin="none"
          highlightDirty={false}
          label=""
          disabled={getValues("changes_since") === "published"}
          // size={{ xs: 6 }}
          // sx={{ width: 1 / 2 }}
        />
      </Grid>
      <Grid size={7}>
        <Field
          field_type="select"
          name="since_unit"
          label=""
          options={["days", "weeks", "months", "years"]}
          margin="none"
          disableClearable
          returnFullObject={false}
          highlightDirty={false}
          disabled={getValues("changes_since") === "published"}
          // sx={{ width: 2 / 3 }}
          // size={6}

          // sx={{ flex: "1 1 auto" }}
        />
      </Grid>
      <Grid size="auto">
        <span>ago</span>
      </Grid>
    </Stack>
  );
  if (!publishDate) {
    return;
  }

  return (
    <Box>
      <Form formContext={formContext}>
        <AutoSubmit action={setFilter} />
        <Grid container spacing={2}>
          {fields.map((field) => {
            if (field.name === "date_modified") {
              return (
                <Grid key="date_modified" size={{ xs: 12, md: 9.6 }} direction={"row"} textAlign={"left"}>
                  <Field
                    field_type="radio_group"
                    name="changes_since"
                    row
                    options={[
                      {
                        id: "published",
                        label: (
                          <>
                            Last Publish Date{" "}
                            <Typography variant="caption">({publishDate.format("YYYY-MM-DD hh:mm A")})</Typography>
                          </>
                        ),
                      },
                      { id: "custom", label: customLabel },
                    ]}
                  />
                </Grid>
              );
            } else {
              return (
                <Grid key={field.name} size={{ xs: 12, md: 2.4 }}>
                  <Field {...field} highlightDirty={false} fullWidth />
                </Grid>
              );
            }
          })}
        </Grid>
      </Form>
    </Box>
  );
});

function ReviewChanges() {
  const [values, setValues] = useState({ data: [], total: 0 });
  const [order, setOrder] = useState(initialOrder);
  const [pagination, setPagination] = useState(initialPage);
  const [loading, setLoading] = useState(true);
  const [publishDate, setPublishDate] = useState(null);
  const [filter, setFilter] = useState(defaultValues);

  useEffect(() => {
    setPagination(initialPage);
  }, [filter]);

  useEffect(() => {
    const fetchPublishDate = async () => {
      if (!publishDate) {
        const { date_published } =
          (await snapshots.find({ query: { is_live: true, $select: ["date_published"] } }))[0] || {};
        const date = dayjs(date_published);
        setPublishDate(date);
        // setFilter((f) => ({ ...f, date_modified: date }));
      }
    };
    fetchPublishDate();
  }, [publishDate]);

  // console.log(values);
  const fetchValues = useDebouncedCallback(
    useCallback(async () => {
      setLoading(true);
      const query = createQuery(filter, publishDate);
      const { field = "date_modified", sort = "asc" } = order[0] || {};
      const $sort = { [field || "date_modified"]: sort === "desc" ? 0 : 1 };
      if (field !== "item") {
        $sort.date_modified = sort === "desc" ? 0 : 1;
      }
      const values = await review_changes.find({
        query: {
          ...query,
          $limit: pagination.limit,
          $skip: pagination.skip,
          $sort,
        },
      });
      const updatedValues = values.data.map((item) => {
        item.type = startCase(item.type);
        item.action = startCase(item.action);
        return item;
      });

      setValues({ data: updatedValues, total: values.total });
      setPagination((prevPagination) => ({ ...prevPagination, page: pagination.page + 1 }));
      setLoading(false);
    }, [filter, order, pagination.limit, pagination.page, pagination.skip, publishDate]),
    300,
  );

  const updateReview = useCallback(
    async (id, type, needs_review) => {
      const service = type === "Collection" ? collections : records;
      await service.patch(id, {
        needs_review: !needs_review,
      });
      await fetchValues();
    },
    [fetchValues],
  );

  const columns = useMemo(
    () => [
      {
        field: "title",
        flex: 2,
        renderCell: ({ value, row: { type, id } }) => (
          <Link target="_blank" to={`/admin/${type.toLowerCase()}s/${id}/review`}>
            {value}
          </Link>
        ),
        maxWidth: "200px",
      },
      {
        field: "type",
        flex: 0.5,
      },
      {
        field: "action",
        flex: 0.5,
      },
      {
        field: "contributor_name",
        headerName: "User",
        flex: 1,
      },
      {
        field: "date_modified",
        flex: 1.2,
        type: "dateTime",
        valueGetter: (value) => value && new Date(value),
      },
      {
        headerName: "Reviewed",
        field: "needs_review",
        flex: 1.2,
        type: "boolean",
        renderCell: ({ value, id, row: { type } }) => (
          <Box>
            <Button size="small" variant="outlined" onClick={() => updateReview(id, type, value)}>
              Mark as {value ? "Reviewed" : "Needs Review"}
            </Button>
          </Box>
        ),
      },
    ],
    [updateReview],
  );
  useEffect(() => {
    fetchValues();
  }, [filter, fetchValues, order, pagination.skip]);

  const handleSortModelChange = (order) => {
    setOrder(order);
  };

  const handlePaginationModelChange = ({ page, pageSize }) => {
    setPagination({ skip: page * pageSize, limit: pageSize });
  };

  return (
    <ViewContainer
      headerElements={[
        <ReviewChangesForm
          key={"form"}
          // filter={filter}
          setFilter={setFilter}
          // fetchValues={fetchValues}
          publishDate={publishDate}
          // setPublishDa]}
        />,
      ]}
      noPaper
    >
      <Stack
        spacing={3}
        direction={"column"}
        sx={{ height: "100%" }}
        divider={<Divider orientation="horizontal" flexItem />}
      >
        <Box sx={{ display: "flex", justifyContent: "center", flexGrow: 1, flexShrink: 1, overflow: "hidden" }}>
          <EditableDataTable
            rows={values.data}
            columns={columns}
            idField="id"
            model="list_items"
            sortingMode="server"
            paginationMode="server"
            loading={loading}
            initialState={{
              sorting: {
                sortModel: initialOrder,
              },
            }}
            // autosizeColumns
            paginationModel={{ page: pagination.skip / pagination.limit, pageSize: pagination.limit }}
            onPaginationModelChange={handlePaginationModelChange}
            pageSizeOptions={[pagination.limit]}
            rowCount={values.total}
            sortModel={order}
            sortingOrder={["desc", "asc"]}
            onSortModelChange={handleSortModelChange}
            readonly
            slotProps={{
              toolbar: {
                showQuickFilter: false,
              },
            }}
          />
        </Box>
        {/* <Box sx={{ display: "flex", justifyContent: "center", flexGrow: 1, flexShrink: 1, overflow: "hidden" }}>
          <Record id={4760} embedded />
        </Box> */}
      </Stack>
    </ViewContainer>
  );
}
export default ReviewChanges;
