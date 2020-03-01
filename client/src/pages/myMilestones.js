import Milestone from "./components/Milestone";
import React, { Fragment, useContext } from "react";
import { SelectionContext } from "./components/SelectionContext";
function MyMilestone() {
  const { state } = useContext(SelectionContext);
  return (
    <Fragment>
      <div className="mx-3">
        {state.planId !== "-1" && (
          <Milestone
            userId="1"
            planRoot={state.planId}
            target="LTCons2"
            planId="1"
            details={true}
          />
        )}
        {state.planId === "-1" && (
          <div>
            Please choose a domain, plan, and milestone from the options above.
          </div>
        )}
      </div>
    </Fragment>
  );
}

export default MyMilestone;
