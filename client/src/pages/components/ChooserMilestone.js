import React, { Fragment, useContext } from "react";
import { useQuery } from "@apollo/react-hooks";
import gql from "graphql-tag";

import { SelectionContext } from "./SelectionContext";

const ChooserMilestone = props => {
  /*   const [order, setOrder] = React.useState("asc");
  const [orderBy, setOrderBy] = React.useState("name");
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10); */
  const { state, setLocalState } = useContext(SelectionContext);
  /* const userId = selections.userId; */
  const GET_MILESTONES = planId => gql`
  query listMilestones {
    PlanRoot(id:"${planId}") {
      has_milestone {
        ms
        short_name {label}
      }
    }
  }
`;
  const { loading, data, error } = useQuery(
    GET_MILESTONES(state.planId || "-1"),
    {
      variables: {
        /*       first: rowsPerPage,
      offset: rowsPerPage * page,
      orderBy: orderBy + "_" + order */
      }
    }
  );

  const updateSelectedMilestone = milestone => {
    localStorage.setItem("SelectedMilestone", milestone);
    setLocalState({
      ...state,
      milestoneId: milestone
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
            defaultValue={state.milestoneId}
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
