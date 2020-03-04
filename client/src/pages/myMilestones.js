import Milestone from "./components/Milestone";
import React, { Fragment, useContext } from "react";
import { SITREP } from "./queries";
import { useQuery } from "@apollo/react-hooks";

function MyMilestone() {
  const { planId, milestoneID, domainId } = useQuery(SITREP);
  return (
    <Fragment>
      <div className="mx-3">
        {planId !== "-1" && milestoneID !== "-1" && domainId !== "-1" && (
          <Milestone planId="1" details={true} />
        )}
        {planId === "-1" && (
          <div>
            Please choose a domain, plan, and milestone from the options above.
          </div>
        )}
      </div>
    </Fragment>
  );
}

export default MyMilestone;
