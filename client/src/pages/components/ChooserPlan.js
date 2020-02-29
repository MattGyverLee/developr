import React, { setState, Component, Fragment } from "react";
import { graphql } from "react-apollo";
import { useQuery } from "@apollo/react-hooks";
import gql from "graphql-tag";
import Graph from "./Graph";

const GET_PLANS = gql`
  query listPlans {
    PlanRoot {
      id
      label
    }
  }
`;

function ChooserPlan(props) {
  const [order, setOrder] = React.useState("asc");
  const [orderBy, setOrderBy] = React.useState("name");
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [selectedPlan, setSelectedPlan] = React.useState("-1");

  const { loading, data, error } = useQuery(GET_PLANS, {
    variables: {
      first: rowsPerPage,
      offset: rowsPerPage * page,
      orderBy: orderBy + "_" + order
    }
  });
  // const [loading, setLoading] = React.useState(true);

  return (
    <div>
      {loading && !error && <p>Loading...</p>}
      {error && !loading && <p>Error</p>}
      {data && !loading && !error && (
        <Fragment>
          <select
            id="PlanDrop"
            name="progress"
            defaultValue="-1"
            value={selectedPlan}
            onChange={e => setSelectedPlan(e.currentTarget.value)}>
            <option key="-1" value="-1">
              Not Selected
            </option>
            {data.PlanRoot.map(plan => (
              <option key={plan.id} value={plan.id}>
                {plan.label}
              </option>
            ))}
          </select>
          <div>{console.log(data)}</div>
          {selectedPlan === "1-root" && <Graph planId="1" userId="1" />}
          {selectedPlan === "0-root" && <Graph planId="0" userId="1" />}
        </Fragment>
      )}
    </div>
  );
}

export default ChooserPlan;
