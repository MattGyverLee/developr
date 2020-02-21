import Plan from "./Plan";
import React, { Fragment } from "react";
import NavBar from "./NavBar";

function MyPlan() {
  return (
    <Fragment>
      {NavBar("myPlan")}
      <div className="div mx-3" maxWidth="100%" minWidth="98%">
        <h1>Developer</h1>
        <Plan />
      </div>
    </Fragment>
  );
}

export default MyPlan;
