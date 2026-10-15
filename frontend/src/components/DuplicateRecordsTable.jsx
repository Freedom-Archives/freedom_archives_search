import { InputLabel, MenuItem, Paper, Select, TextField } from "@mui/material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import {
  GridFooter,
  GridFooterContainer,
  gridPaginationModelSelector,
  gridRowCountSelector,
  useGridApiContext,
  useGridSelector,
} from "@mui/x-data-grid";
import { cloneDeep } from "lodash-es";
import { lazy, useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { duplicate_records } from "src/api";
import { queryStores } from "src/stores";
import { useDebouncedCallback } from "use-debounce";

import Show from "./Show";

const DataGrid = lazy(() => import("@mui/x-data-grid").then((module) => ({ default: module.DataGrid })));

const defaultSort = { field: "title_1", sort: "asc" };

const PAGE_SIZE_DEFAULT = 100;

const sort_options = {
  title_1: {
    label: "Record Name",
    sort: { title_1: 1, relevance: -1 },
  },
  title_2: {
    label: "Record Name",
    sort: { title_2: 1, relevance: -1 },
  },
  relevance: { label: "Similarity Score", sort: { relevance: -1, title_1: 1 } },
};

const getRowId = (row) => row.duplicate_record_id;

function RecordCell({ row, index }) {
  return (
    <Stack spacing={0} sx={{ py: 1 }}>
      <Typography variant="body1">{row[`title_${index}`]}</Typography>
      <Typography variant="caption" color="text.secondary">
        Record ID: {row[`record_id_${index}`]}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        Collection: {row[`collection_${index}`]}
      </Typography>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {(row[`call_numbers_${index}`] || []).map((cn) => (
          <Chip key={cn} label={cn} size="small" variant="outlined" />
        ))}
      </Stack>
    </Stack>
  );
}

function DuplicateRecords() {
  const useStore = queryStores["duplicate_records"];
  const [items, setItems] = useState([]);
  const offset = useStore((s) => s.search.offset);
  const setSearch = useStore((s) => s.setSearch);
  const [loading, setLoading] = useState(true);
  const sort = useStore((s) => s.search.filter.sort);
  const sortDesc = useStore((s) => s.search.filter.sort_desc);
  const search = useStore((s) => s.search.filter.search);

  const createQuery = useCallback((filter) => {
    const { sort = "relevance", sort_desc = true, search } = filter;
    const query = {
      $select: [
        "duplicate_record_id",
        "record_id_1",
        "title_1",
        "collection_1",
        "call_numbers_1",
        "record_id_2",
        "title_2",
        "collection_2",
        "call_numbers_2",
        "relevance",
      ],
      is_ignored: false,
    };

    query.$sort = cloneDeep(sort_options[sort].sort);
    if (search) {
      const $ilike = `%${search}%`;
      query.$or = [
        { title_1: { $ilike } },
        { title_2: { $ilike } },
        { call_numbers_text_1: { $ilike } },
        { call_numbers_text_2: { $ilike } },
      ];
    }
    if (sort_desc) {
      for (const key in query.$sort) {
        query.$sort[key] *= -1;
      }
    }
    return query;
  }, []);

  const lookupItems = useCallback(
    async ({ offset, page_size, sort, sortDesc, search, signal }) => {
      setLoading(true);
      const query = createQuery({ sort, sort_desc: sortDesc, offset, search });
      query.$limit = page_size;
      query.$skip = offset;
      try {
        const { data, total } = await duplicate_records.find({ query, connection: { signal } });
        setItems(data);
        setSearch({ total, query, page_size, offset });
        setLoading(false);
      } catch (error) {
        if (signal.aborted) return; // superseded by a newer request; it owns `loading`
        setLoading(false);
      }
    },
    [createQuery, setSearch],
  );

  useEffect(() => {
    const controller = new AbortController();
    lookupItems({ offset, sort, sortDesc, page_size: PAGE_SIZE_DEFAULT, search, signal: controller.signal });
    return () => controller.abort();
  }, [offset, sort, sortDesc, search, lookupItems]);

  return <DuplicateRecordsTable items={items} loading={loading} />;
}

function CustomFooter(props) {
  const apiRef = useGridApiContext();
  const paginationModel = useGridSelector(apiRef, gridPaginationModelSelector);
  const rowCount = useGridSelector(apiRef, gridRowCountSelector);

  const totalPages = Math.ceil(rowCount / paginationModel.pageSize);

  return (
    <GridFooterContainer>
      <Show when={totalPages > 0}>
        <Box sx={{ ml: 1, display: "flex", alignItems: "baseline", gap: 1 }}>
          <InputLabel sx={{ mb: 0 }}>Current page</InputLabel>
          <Select
            label="Go to page"
            variant="standard"
            disableUnderline
            size="small"
            value={paginationModel.page}
            onChange={(e) => {
              apiRef.current.setPage(Number(e.target.value));
            }}
            sx={{ mb: 0 }}
          >
            {Array.from({ length: totalPages }, (_, i) => (
              <MenuItem key={i} value={i}>
                {i + 1}
              </MenuItem>
            ))}
          </Select>
        </Box>
      </Show>
      <GridFooter {...props} />
    </GridFooterContainer>
  );
}

function DuplicateRecordsTable({ items, loading }) {
  const useStore = queryStores["duplicate_records"];
  const total = useStore((s) => s.search.total);
  const setSearchIndex = useStore((s) => s.setSearchIndex);
  const offset = useStore((s) => s.search.offset);
  const setSearch = useStore((s) => s.setSearch);
  const sortField = useStore((s) => s.search.filter.sort);
  const sortDesc = useStore((s) => s.search.filter.sort_desc);
  const search = useStore((s) => s.search.filter.search);
  const [searchValue, setSearchValue] = useState(search ?? "");

  const setPaginationModel = useCallback(
    ({ page, pageSize }) => {
      setSearch({ offset: page * pageSize, page_size: pageSize });
      setSearchIndex(page * pageSize);
    },
    [setSearch, setSearchIndex],
  );

  const setSortModel = useCallback(
    (model) => {
      const { field, sort } = model?.[0] || defaultSort;
      setSearch({ filter: { sort: field, sort_desc: sort === "desc", search }, offset: 0 });
      setSearchIndex(0);
    },
    [search, setSearch, setSearchIndex],
  );

  const setSearchTerm = useDebouncedCallback(
    useCallback(
      (term) => {
        setSearch({ filter: { search: term, sort: sortField, sort_desc: sortDesc }, offset: 0 });
        setSearchIndex(0);
      },
      [setSearch, setSearchIndex, sortDesc, sortField],
    ),
    300,
  );

  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearchValue(value);
    setSearchTerm(value);
  };

  const navigate = useNavigate();

  const sortModel = useMemo(() => [{ field: sortField, sort: sortDesc ? "desc" : "asc" }], [sortField, sortDesc]);
  const paginationModel = useMemo(
    () => ({ page: Math.floor(offset / PAGE_SIZE_DEFAULT), pageSize: PAGE_SIZE_DEFAULT }),
    [offset],
  );

  const columns = useMemo(
    () => [
      {
        field: "compare",
        headerName: "Compare",
        justifyContent: "center",
        align: "center",
        renderCell: (params) => (
          <Box sx={{ height: "100%", display: "flex", alignItems: "center" }}>
            <Button
              variant="outlined"
              onClick={() => {
                setSearchIndex(offset + items.indexOf(params.row));
                navigate(`/admin/site/find-duplicates/${params.row.record_id_1}/${params.row.record_id_2}`);
              }}
            >
              Compare
            </Button>
          </Box>
        ),
      },
      {
        field: "title_1",
        headerName: "Record 1",
        flex: 1,
        renderCell: ({ row }) => <RecordCell row={row} index={1} />,
      },
      {
        field: "title_2",
        headerName: "Title 2",
        flex: 1,
        renderCell: ({ row }) => <RecordCell row={row} index={2} />,
      },
      {
        field: "relevance",
        headerName: "Similarity Score",
        flex: 0.5,
        align: "right",
        valueFormatter: (value, row) => (row.relevance * 100).toFixed(2) + "%",
      },
    ],
    [offset, items, navigate, setSearchIndex],
  );

  return (
    <Stack direction="column" spacing={2} sx={{ maxHeight: "100%", minHeight: 0 }}>
      <Paper>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            size="small"
            label="Filter Titles or Call Numbers"
            value={searchValue}
            onChange={handleSearchChange}
            sx={{ width: 360, maxWidth: "100%" }}
          />
        </Stack>
      </Paper>
      <DataGrid
        rows={items}
        getRowId={getRowId}
        getRowHeight={() => "auto"}
        rowCount={total}
        columns={columns}
        loading={loading}
        density="compact"
        showCellVerticalBorder
        disableRowSelectionOnClick
        onPaginationModelChange={setPaginationModel}
        filterMode="server"
        sortingMode="server"
        paginationMode="server"
        onSortModelChange={setSortModel}
        paginationModel={paginationModel}
        sortModel={sortModel}
        pageSizeOptions={[PAGE_SIZE_DEFAULT]}
        slots={{
          footer: CustomFooter,
        }}
      />
    </Stack>
  );
}

export default DuplicateRecords;
