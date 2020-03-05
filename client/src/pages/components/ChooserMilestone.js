import React, { Fragment, useContext } from "react";
import { useQuery, useMutation } from "@apollo/react-hooks";
import { SITREP, GET_MILESTONES, SET_MILESTONE } from "../queries";

const ChooserMilestone = props => {
  /*   const [order, setOrder] = React.useState("asc");
  const [orderBy, setOrderBy] = React.useState("name");
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10); */

  var { planId, milestoneId } = useQuery(SITREP);
  /* const userId = selections.userId; */

  const { loading, data, error } = useQuery(GET_MILESTONES(planId || "-1"), {
    variables: {
      /*       first: rowsPerPage,
      offset: rowsPerPage * page,
      orderBy: orderBy + "_" + order */
    }
  });
  const [setMilestone] = useMutation(SET_MILESTONE);

  const updateSelectedMilestone = milestone => {
    localStorage.setItem("SelectedMilestone", milestone);
    // fixme: Make this a mutation
    setMilestone({
      variables: {
        user: "1",
        Name: "Matthew",
        chosenMilestone: milestone
      }
    });
  };

  return (
    <div>
      {loading && !error && <p>Loading...</p>}
      {error && !loading && <p>Error</p>}
      {data && !loading && !error && (
        <Fragment>
          <select
            id="MilestoneDrop"
            name="milestones"
            defaultValue={milestoneId}
            onChange={e => updateSelectedMilestone(e.currentTarget.value)}>
            {/* todo: Use UseEffect https://www.robinwieruch.de/local-storage-react */}
            <option key="-1" value="-1">
              Not Selected
            </option>
            {data.PlanRoot &&
              data.PlanRoot.length > 0 &&
              data.PlanRoot[0].has_milestone.length > 0 &&
              data.PlanRoot[0].has_milestone.map(milestone => (
                <option key={milestone.ms} value={milestone.ms}>
                  {milestone.short_name[0].label}
                </option>
              ))}
          </select>
        </Fragment>
      )}
    </div>
  );
};

export default ChooserMilestone;
