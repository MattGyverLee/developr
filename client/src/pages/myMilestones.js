import Milestone from "./components/Milestone";
import React, { Fragment } from "react";
import NavBar from "./components/NavBar";

function MyMilestone() {
  return (
    <Fragment>
      {NavBar("myMilestones")}
      <div className="mx-3">
        <Milestone
          userId="1"
          planRoot="1-root"
          target="LTCons2"
          planId="1"
          details={true}
        />
      </div>
    </Fragment>
  );
}

export default MyMilestone;
