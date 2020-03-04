import React, { Fragment } from "react";
import Graph from "./components/Graph";
import { SITREP } from "./queries";
import { useQuery } from "@apollo/react-hooks";

function VisPage() {
  const { planId } = useQuery(SITREP);
  return (
    <Fragment>
      <div className="mx-3">
        <h2>Plan Visualization</h2>
        {planId === "1-root" && <Graph planId="1" userId="1" />}
        {planId === "0-root" && <Graph planId="0" userId="1" />}
        {planId === "-1" && (
          <div>Please choose a domain and plan from the options above.</div>
        )}
      </div>
    </Fragment>
  );
}

export default VisPage;
