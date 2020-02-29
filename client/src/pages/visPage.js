import React, { Fragment } from "react";
import NavBar from "./components/NavBar";
import ChooserPlan from "./components/ChooserPlan";

function VisPage() {
  return (
    <Fragment>
      {NavBar("graph")}
      <div className="mx-3" maxWidth="100%" minWidth="98%">
        <h2>Plan Visualization</h2>
        <ChooserPlan subElement="graph" />
      </div>
    </Fragment>
  );
}

export default VisPage;
