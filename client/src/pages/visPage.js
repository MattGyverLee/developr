import React, { Fragment, useContext } from "react";
import { SelectionContext } from "../components/utilities/SelectionContext";
import Graph from "../components/graph/Graph";
function VisPage() {
  const { state } = useContext(SelectionContext);
  return (
    <Fragment>
      <div className="mx-3">
        <h2>Plan Visualization</h2>
        {state.planId !== "-1" && <Graph planId={state.planId} userId="1" />}
        {state.planId === "-1" && (
          <div id="makeChoices">
            Please choose a domain and plan from the options above.
          </div>
        )}
      </div>
    </Fragment>
  );
}

export default VisPage;
