import React, { Fragment, useContext } from "react";
import { useQuery } from "@apollo/react-hooks";
import { SITREP, LIST_PLANS } from "../queries";
import ChooserMilestone from "./ChooserMilestone";

function ChooserPlan(props) {
  /*   const [order, setOrder] = React.useState("asc");
  const [orderBy, setOrderBy] = React.useState("name");
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10); */
  /* const userId = selections.userId; */

  var { domainId } = useQuery(SITREP);

  const { loading, data, error } = useQuery(LIST_PLANS(domainId || "-1"), {
    variables: {
      /*       first: rowsPerPage,
      offset: rowsPerPage * page,
      orderBy: orderBy + "_" + order */
    }
  });

  const updateSelectedPlan = plan => {
    localStorage.setItem("SelectedPlan", plan);
    // fixme: Write this as mutation
    /* cache.writeData({
      data: {
        planId: plan,
        milestoneId: "-1"
      }
    }); */
  };

  var { planId } = useQuery(SITREP);
  if (!planId) updateSelectedPlan("-1");
  return (
    <div>
      {loading && !error && <p>Loading...</p>}
      {error && !loading && <p>Error</p>}
      {data && !loading && !error && (
        <Fragment>
          <select
            id="PlanDrop"
            name="progress"
            value={planId}
            onChange={e => updateSelectedPlan(e.currentTarget.value)}>
            {/* todo: Use UseEffect https://www.robinwieruch.de/local-storage-react */}
            <option key="-1" value="-1">
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
          {planId !== "-1" && <ChooserMilestone />}
        </Fragment>
      )}
    </div>
  );
}

export default ChooserPlan;
