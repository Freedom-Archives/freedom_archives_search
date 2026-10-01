import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { snapshots, version_history } from "src/api";

import { CompareRecord } from "./RecordHistory";

const ReviewRecord = () => {
  const [version, setVersion] = useState({});
  const [lastPublishDate, setLastPublishDate] = useState(null);
  const [loading, setLoading] = useState(false);
  const { id } = useParams();

  useEffect(() => {
    const fetchLastPublishDate = async () => {
      setLoading(true);
      const snapshot = await snapshots.find({ query: { $sort: { date_published: -1 }, $limit: 1 } });
      const date_published = snapshot?.[0]?.date_published;
      setLastPublishDate(new Date(date_published));
      const versions = await version_history.find({
        query: {
          item_id: id,
          type: "record",
          date: {
            $gte: date_published,
          },
          $sort: { date: 1 },
          $limit: 1,
        },
      });
      if (versions?.length > 0) {
        setVersion(versions[0]);
      }
      setLoading(false);
    };
    if (!version?.date) {
      fetchLastPublishDate();
    }
  }, [id, version]);

  return (
    <CompareRecord
      version={version}
      id={id}
      missingMessage={`No changes since last publish date (${lastPublishDate?.toLocaleString()}) found`}
      loading={loading}
    />
  );
};

export default ReviewRecord;
