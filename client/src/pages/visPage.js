import React, { Fragment, useContext, setState } from "react";
import { SelectionContext } from "./components/SelectionContext";
import Graph from "./components/Graph";
function VisPage() {
  const { state, setState } = useContext(SelectionContext);
  return (
    <Fragment>
      <div className="mx-3">
        <h2>Plan Visualization</h2>
        {state.planId === "1-root" && <Graph planId="1" userId="1" />}
        {state.planId === "0-root" && <Graph planId="0" userId="1" />}
        {state.planId === "-1" && (
          <div>Please choose a domain and plan from the options above.</div>
        )}
      </div>
    </Fragment>
  );
}

export default VisPage;
