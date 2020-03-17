import Milestone from "../components/milestone/Milestone";
import React, { Fragment, useContext } from "react";
import { SelectionContext } from "../components/utilities/SelectionContext";
function MyMilestone() {
  const { state } = useContext(SelectionContext);
  return (
    <Fragment>
      <div className="mx-3">
        {state.planId !== "-1" &&
          state.milestoneId !== "-1" &&
          state.domainId !== "-1" && (
            <Milestone planId={state.planId} details={true} />
          )}
        {(state.domainId === "-1" ||
          state.planId === "-1" ||
          state.milestoneId === "-1") && (
          <div id="makeChoices">
            Please choose a domain, plan, and milestone from the options above.
          </div>
        )}
      </div>
    </Fragment>
  );
}

export default MyMilestone;
