import Plan from "./components/Plan";
import React, { Fragment, useContext } from "react";
import { useQuery } from "@apollo/react-hooks";
import { SITREP } from "./queries";

function MyPlan() {
  const { planId } = useQuery(SITREP);
  return (
    <Fragment>
      <div className="mx-3">
        {planId !== "-1" && <Plan userId="1" planRoot={planId} planId="1" />}
        {planId === "-1" && (
          <div>Please choose a domain and plan from the options above.</div>
        )}
      </div>
    </Fragment>
  );
}

export default MyPlan;
