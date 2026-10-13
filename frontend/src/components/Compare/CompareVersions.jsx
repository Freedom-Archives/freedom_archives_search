import Stack from "@mui/material/Stack";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { FormManagerContext } from "src/components/form/FormManagerContext";

import { MEDIA_FIELD_SPECS } from "./compareConfig";
import CompareItemList from "./CompareItemList";
import CompareMediaCard from "./CompareMediaCard";
import {
  CompareChangesSection,
  CompareFieldsSection,
  CompareHeader,
  StaticCompareField,
} from "./CompareSharedComponents";
import { compareItemLists, getFieldDiffs, getMediaComparison, getMediaPairs, summarizeStatuses } from "./CompareUtils";

// The media of the two versions, paired up by media_id
const VersionsMediaSection = ({ newerMedia, olderMedia, showOnlyDiffs, leftForm, rightForm }) => {
  const pairs = useMemo(
    () => getMediaPairs(newerMedia, olderMedia, getMediaComparison(newerMedia, olderMedia)),
    [newerMedia, olderMedia],
  );
  const statuses = pairs.map(({ status }) => status);
  if (showOnlyDiffs && !statuses.some(Boolean)) {
    return null;
  }

  return (
    <CompareChangesSection title="Media" summary={summarizeStatuses(statuses)}>
      <Stack direction="column" spacing={3}>
        {pairs
          .filter(({ status }) => status || !showOnlyDiffs)
          .map(({ mediaId, current, compare, itemDiffs, diffSpecs, status }) => (
            <CompareMediaCard
              key={mediaId}
              media={(current ?? compare).media}
              note={!status && "no differences"}
              status={status}
              muted={!current}
            >
              {(showOnlyDiffs ? diffSpecs : MEDIA_FIELD_SPECS).map(({ path, ...options }) => (
                <StaticCompareField
                  key={path}
                  name={current ? `media.${current.index}.${path}` : null}
                  compareName={compare ? `media.${compare.index}.${path}` : null}
                  options={options}
                  hasDiff={itemDiffs.has(path)}
                  leftForm={leftForm}
                  rightForm={rightForm}
                />
              ))}
            </CompareMediaCard>
          ))}
      </Stack>
    </CompareChangesSection>
  );
};

// A list of related items (e.g. a collection's records) in the two versions
const VersionsListSection = ({ name, label, type, ordered = false, newer, older, showOnlyDiffs }) => {
  const diff = useMemo(
    () => compareItemLists(newer?.[name], older?.[name], `${type}_id`, ordered),
    [newer, older, name, type, ordered],
  );
  const statuses = diff.currentWithRemoved.map(({ status }) => status);
  if (showOnlyDiffs && !statuses.some(Boolean)) {
    return null;
  }
  return (
    <CompareChangesSection title={label} summary={summarizeStatuses(statuses)}>
      <CompareItemList
        entries={diff.currentWithRemoved}
        type={type}
        ordered={ordered}
        showAll={!showOnlyDiffs}
        title="After this change"
        count={diff.current.length}
      />
    </CompareChangesSection>
  );
};

// Read-only comparison of two saved versions of an item: the version after a change (newer, left column) and the
// version before it (older, right column).
//   config: the item type's entry in COMPARE_CONFIG
//   id: the item's id, for links
const CompareVersions = ({ config, id, newer, older }) => {
  const { service, schema, fields, label, hasMedia, relationLists = [] } = config;
  const [showOnlyDiffs, setShowOnlyDiffs] = useState(true);
  // In-memory forms for the fields to display each version's values
  const leftForm = useForm({ values: newer });
  const rightForm = useForm({ values: older });
  const diffFields = useMemo(() => getFieldDiffs(service, schema, newer, older), [service, schema, newer, older]);
  const route = `/admin/${service}`;

  return (
    // Fields look up their labels by service
    <FormManagerContext.Provider value={{ service }}>
      <Stack direction="column" spacing={2}>
        <CompareHeader
          intro={`The ${label.toLowerCase()} after this change is in the left column, and before it in the right column.`}
          showOnlyDiffs={showOnlyDiffs}
          setShowOnlyDiffs={setShowOnlyDiffs}
          left={{ title: newer?.title, data: newer, route, id }}
          right={{ title: older?.title, data: older, route, id }}
        />
        {fields.map((section, groupIndex) => (
          <CompareFieldsSection
            key={section.title || groupIndex}
            title={section.title}
            fields={section.fields}
            diffFields={diffFields}
            showOnlyDiffs={showOnlyDiffs}
            renderField={(name) => (
              <StaticCompareField
                key={name}
                name={name}
                options={schema[name] ?? {}}
                hasDiff={diffFields.has(name)}
                leftForm={leftForm}
                rightForm={rightForm}
              />
            )}
          />
        ))}
        {hasMedia && (
          <VersionsMediaSection
            newerMedia={newer?.media}
            olderMedia={older?.media}
            showOnlyDiffs={showOnlyDiffs}
            leftForm={leftForm}
            rightForm={rightForm}
          />
        )}
        {relationLists.map((list) => (
          <VersionsListSection key={list.name} newer={newer} older={older} showOnlyDiffs={showOnlyDiffs} {...list} />
        ))}
      </Stack>
    </FormManagerContext.Provider>
  );
};

export default CompareVersions;
