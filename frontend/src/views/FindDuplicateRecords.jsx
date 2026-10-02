import CompareRecords from "src/components/Compare/CompareRecords";
import DuplicateRecordsTable from "src/components/DuplicateRecordsTable";

function FindDuplicateRecords({ params: { id1, id2 } }) {
  if (id1 && id2) {
    return <CompareRecords id1={id1} id2={id2} />;
  }
  return <DuplicateRecordsTable />;
}

export default FindDuplicateRecords;
