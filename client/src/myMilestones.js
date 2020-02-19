import React, { Fragment } from "react";
import NavBar from "./components/NavBar";

function MyMilestones() {
  return (
    <Fragment>
      {NavBar("myMilestones")}
      <h2>My Milestones</h2>
    </Fragment>
  );
}

export default MyMilestones;
