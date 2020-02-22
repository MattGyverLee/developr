import Plan from "./components/Plan";
import React, { Fragment } from "react";
import NavBar from "./components/NavBar";

function MyPlan() {
  return (
    <Fragment>
      {NavBar("myPlan")}
      <div className="mx-3">
        <Plan userId="1" planRoot="1-root" planId="1" />
      </div>
    </Fragment>
  );
}

export default MyPlan;
