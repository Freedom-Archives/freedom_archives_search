import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import Grid from '@mui/material/Grid';
import Icon from '@mui/material/Icon';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { startCase } from "lodash-es";
import { useState } from "react";
import Link from "src/components/Link";
import {
  INITIAL_FILTER_DISPLAY_COUNT,
  FILTER_TYPE_LABELS,
  FILTER_TYPES,
  SORT_OPTIONS,
} from "src/public/PublicSearch/constants";
import { useDebouncedCallback } from "use-debounce";

import { SearchInput } from "./SearchInput";

const FilterItem = ({ value, label, count, type, addFilter, search }) => {
  return (
    <ListItemButton onClick={() => addFilter({ type, value })}>
      <ListItemText
        slotProps={{
          primary: {
            sx: {
              color: "primary.main",
              fontWeight: (search[type] || []).includes(value) ? 800 : 400,
            },
          },
        }}
        primary={label || "???"}
      />
      <Chip size="small" variant="outlined" label={count.toLocaleString()} sx={{ ml: "auto" }} />
    </ListItemButton>
  );
};

const Filter = ({ type, values, addFilter, search }) => {
  const [limit, setlimit] = useState(INITIAL_FILTER_DISPLAY_COUNT);
  return (
    <Box key={type}>
      <Typography variant="overline" sx={{ color: "text.secondary" }}>
        {startCase(FILTER_TYPE_LABELS[type] || type)}
      </Typography>
      <List dense sx={{ p: 0 }}>
        {(values || []).slice(0, limit).map(([label, count, value]) => (
          <FilterItem
            key={label}
            {...{
              value: value || label,
              label,
              count,
              type,
              addFilter,
              search,
            }}
          />
        ))}
        {values && values.length > limit && (
          <ListItem sx={{ justifyContent: "end" }}>
            <Button size="small" variant="text" startIcon={<Icon>add</Icon>} onClick={() => setlimit(limit + 5)}>
              Show More...
            </Button>
          </ListItem>
        )}
      </List>
    </Box>
  );
};

const LoadingFilters = () => {
  return [1, 2, 3].map((i) => (
    <Box key={i}>
      <Typography variant="overline" sx={{ color: "text.secondary" }}>
        <Skeleton width="60%" />
      </Typography>
      <List dense sx={{ p: 0 }}>
        {[1, 2, 3].map((i) => (
          <ListItem key={i}>
            <Skeleton width="100%" />
          </ListItem>
        ))}
      </List>
    </Box>
  ));
};
export const SearchFilters = ({ search, filters, addFilter, clearFilters, loading }) => {
  // const nonDigitizedTotalString = (parseInt(nonDigitizedTotal, 10) || 0).toLocaleString();
  return (
    <Box
      // p={1}
      sx={{ backgroundColor: (theme) => theme.palette.background.paper }}
      className="flex-container"
    >
      <Grid size={12} container alignItems="center" justifyContent="space-between">
        <Typography variant="h6">Filter Results</Typography>
        <Button startIcon={<Icon>clear</Icon>} color="inherit" size="small" variant="text" onClick={clearFilters}>
          Clear Filters
        </Button>
      </Grid>
      <Grid size={12} className="flex-scroller">
        <Stack
          spacing={1}
          divider={<Divider orientation="horizontal" flexItem />}
          sx={{
            mt: 1,
            backgroundColor: (theme) => theme.palette.background.paper,
          }}
        >
          {loading && <LoadingFilters />}
          {!loading &&
            FILTER_TYPES.filter((type) => filters[type] && filters[type].length > 0).map((type) => {
              return <Filter key={type} type={type} values={filters[type]} addFilter={addFilter} search={search} />;
            })}
        </Stack>
      </Grid>
    </Box>
  );
};


export function SearchForm({ search, doSearch, nonDigitizedTotal, total, loadedCount, focus, loading, collections }) {
  const [textSearchValue, setTextSearchValue] = useState(search.fullText);
  const debouncedSearch = useDebouncedCallback((fields) => doSearch(fields), 300);

  return (
    <Grid container spacing={1} alignItems="center">
      <Grid size={{ xs: 8, md: 6 }}>
        <SearchInput
          focus={focus}
          value={textSearchValue}
          onChange={(e) => {
            setTextSearchValue(e.target.value);
            debouncedSearch({ fullText: e.target.value });
          }}
        />
      </Grid>
      <Grid size={{ xs: 4, md: 3 }}>
        <Select
          name="sort"
          label="Sort by"
          size="small"
          value={search.sort}
          onChange={(e) => doSearch({ sort: e.target.value })}
          fullWidth
        >
          {Object.keys(SORT_OPTIONS).map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </Select>
      </Grid>
      <Grid size={{ xs: 12, md: 3 }}>
        <FormGroup>
          <FormControlLabel
            size="small"
            slotProps={{
              typography: { fontSize: "0.875rem" },
            }}
            control={
              <Checkbox
                name="include_non_digitized"
                checked={search.include_non_digitized}
                onChange={(e) => doSearch({ include_non_digitized: e.target.checked })}
              />
            }
            label="Include non-digitized records"
          />
        </FormGroup>
      </Grid>
      {!loading && (
        <SearchResults
          doSearch={doSearch}
          total={total}
          nonDigitizedTotal={nonDigitizedTotal}
          loadedCount={loadedCount}
          loading={loading}
          collections={collections}
        />
      )}
    </Grid>
  );
}

const CollectionMatches = ({ collections }) => {
  if (!collections || collections.length === 0) return null;
  return (
    <Paper
      elevation={0}
      sx={{ p: 1, my: 1, background: (theme) => theme.palette.action.hover }}
      // variant="outlined"
    >
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        The following collection titles match your search terms:
      </Typography>
      <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }} useFlexGap>
        {collections.map((c) => (
          <Chip
            key={c.collection_id}
            label={c.title}
            component={Link}
            href={`/collections/${c.collection_id}`}
            clickable
            size="small"
            variant="filled"
          />
        ))}
      </Stack>
    </Paper>
  );
};

function SearchResults({
  total,
  nonDigitizedTotal,
  collections,
  // loadedCount = 0,
  // loading,
  doSearch,
}) {
  return (
    <Box sx={{ width: "100%" }}>
      <CollectionMatches collections={collections} />
      {/* <Divider sx={{}} orientation="horizontal" flexItem /> */}
      {total === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
          No records found.
          {nonDigitizedTotal > 0 && (
            <>
              <br />
              Hiding {nonDigitizedTotal} non-digitized records.
              <Button size="small" onClick={() => doSearch({ include_non_digitized: true })}>
                Show All
              </Button>
            </>
          )}
        </Typography>
      ) : (
        <Typography variant="body2" color="text.secondary">
          Found {total.toLocaleString()} record{total !== 1 ? "s" : ""}
        </Typography>
      )}
    </Box>
  );
}
