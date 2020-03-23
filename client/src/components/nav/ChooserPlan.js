import React, { Fragment, useContext } from "react";
import { useQuery, useMutation } from "@apollo/react-hooks";
import { SET_LOCAL_PLAN, LIST_PLANS } from "../queries";

import { SelectionContext } from "../utilities/SelectionContext";
import ChooserMilestone from "./ChooserMilestone";

function ChooserPlan(props) {
  const { state, setLocalState } = useContext(SelectionContext);
  const [setPlan] = useMutation(SET_LOCAL_PLAN);
  const { loading, data, error } = useQuery(
    LIST_PLANS(state.domainId || "-1"),
    {
      variables: {
        /*       first: rowsPerPage,
      offset: rowsPerPage * page,
      orderBy: orderBy + "_" + order */
      }
    }
  );

  function setSelectedIndex(s, i) {
    s.options[i - 1].selected = true;
    return;
  }

  const updateSelectedPlan = plan => {
    setPlan({
      variables: { planId: plan }
    });
    localStorage.setItem("SelectedPlan", plan);
    localStorage.setItem("SelectedMilestone", "-1");
    setLocalState({
      ...state,
      planId: plan,
      milestoneId: "-1"
    });
  };
  if (!state.planId) updateSelectedPlan("-1");
  if (loading && !error) {
    return <p>Loading...</p>;
  }

  if (error && !loading) {
    return <p>Error</p>;
  }

  if (
    data &&
    !loading &&
    !error &&
    data.Domain.length > 0 &&
    data.Domain[0].childPlans &&
    data.Domain[0].childPlans.length > 1
  ) {
    return (
      <Fragment>
        <select
          id="PlanDrop"
          name="PlanDrop"
          value={state.planId}
          onChange={e => updateSelectedPlan(e.currentTarget.value)}>
          <option key="-1" value="-1">
            Not Selected
          </option>
          {data.Domain[0].childPlans.map(plan => (
            <option key={plan.id} value={plan.id}>
              {plan.label}
            </option>
          ))}
        </select>
        <br />
        {state.planId !== "-1" && <ChooserMilestone />}
      </Fragment>
    );
  }
  if (
    data.Domain &&
    data.Domain.length > 0 &&
    data.Domain[0].childPlans &&
    data.Domain[0].childPlans.length === 1
  ) {
    return (
      <Fragment>
        <br />
        <select
          id="PlanDrop"
          name="PlanDrop"
          value={state.planId}
          onChange={e => updateSelectedPlan(e.currentTarget.value)}>
          <option key="-1" value="-1">
            Not Selected
          </option>
          {data.Domain[0].childPlans.map(plan => (
            <option key={plan.id} value={plan.id} selected="selected">
              {plan.label}
            </option>
          ))}
        </select>
        <br />
        {state.planId !== "-1" && <ChooserMilestone />}
        {setSelectedIndex(document.getElementById("PlanDrop"), 2)}
      </Fragment>
    );
  } else return null;
}

export default ChooserPlan;
