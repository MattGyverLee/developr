import Milestone from "./components/Milestone";
import React, { Fragment, useContext } from "react";
import { SelectionContext } from "./components/SelectionContext";
function MyMilestone() {
  const { state } = useContext(SelectionContext);
  return (
    <Fragment>
      <div className="mx-3">
        {state.planId !== "-1" &&
          state.milestoneID !== "-1" &&
          state.domainId !== "-1" && <Milestone planId="1" details={true} />}
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
