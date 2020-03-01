import React, { Fragment, useContext, setState } from "react";
import { useQuery } from "@apollo/react-hooks";
import gql from "graphql-tag";

import { SelectionContext } from "./SelectionContext";

function ChooserPlan(props) {
  /*   const [order, setOrder] = React.useState("asc");
  const [orderBy, setOrderBy] = React.useState("name");
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10); */
  const { state, setLocalState } = useContext(SelectionContext);
  /* const userId = selections.userId; */
  const GET_PLANS = domainId => gql`
  query listPlans  {
    Domain(id: "${domainId}") {childPlans {id label}}
  }
`;
  const { loading, data, error } = useQuery(GET_PLANS(state.domainId || "-1"), {
    variables: {
      /*       first: rowsPerPage,
      offset: rowsPerPage * page,
      orderBy: orderBy + "_" + order */
    }
  });

  const updateSelectedPlan = plan => {
    localStorage.setItem("SelectedPlan", plan);
    setLocalState({
      ...state,
      planId: plan
    });
  };
  if (!state.planId) updateSelectedPlan("-1");
  return (
    <div>
      {loading && !error && <p>Loading...</p>}
      {error && !loading && <p>Error</p>}
      {data && !loading && !error && (
        <Fragment>
          <select
            id="PlanDrop"
            name="progress"
            value={state.planId}
            onChange={e => updateSelectedPlan(e.currentTarget.value)}>
            {/* todo: Use UseEffect https://www.robinwieruch.de/local-storage-react */}
            <option key="-1" Value="-1">
              Not Selected
            </option>
            {data.Domain &&
              data.Domain.length > 0 &&
              data.Domain[0].childPlans &&
              data.Domain[0].childPlans.length > 0 &&
              data.Domain[0].childPlans.map(plan => (
                <option key={plan.id} value={plan.id}>
                  {plan.label}
                </option>
              ))}
          </select>
        </Fragment>
      )}
    </div>
  );
}

export default ChooserPlan;
