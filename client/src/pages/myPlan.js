import Plan from "../components/plan/Plan";
import { SelectionContext } from "../components/utilities/SelectionContext";
import React, { Fragment, useContext } from "react";

function MyPlan() {
  const { state } = useContext(SelectionContext);
  return (
    <Fragment>
      <div className="mx-3">
        {state.planId !== "-1" && (
          <Plan userId="1" planRoot={state.planId} planId="1" />
        )}
        {state.planId === "-1" && (
          <div id="makeChoices">
            Please choose a domain and plan from the options above.
          </div>
        )}
      </div>
    </Fragment>
  );
}

export default MyPlan;
