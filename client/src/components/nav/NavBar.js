import React from "react";
import ChooserDomain from "./ChooserDomain";

const checkLoc = (local, ref) => {
  // console.log(local, ref);
  if (local === ref) {
    return <span className="sr-only">(current)</span>;
  }
};
const NavBar = local => {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary py-1">
      {/* <button
        className="navbar-toggler"
        type="button"
        data-toggle="collapse"
        data-target="#navbarColor01"
        aria-controls="navbarColor01"
        aria-expanded="false"
        aria-label="Toggle navigation">
        <span className="navbar-toggler-icon"></span>
      </button> */}

      <div className="d-flex flex-wrap navbar-nav" id="navbarColor01">
        <a className="navbar-brand text-center" href="./">
          <span className="navbar-brand logo my-n1">level.up</span>
          <br />
          <div className="mb-n1 mt-n2">Growth Tracking</div>
        </a>
        <div className="nav-item active mx-2">
          <a className="nav-link" href="./">
            Home {checkLoc(local, "home")}
          </a>
        </div>
        <div className="nav-item text-center mx-2">
          <a className="nav-link" href="./myPlan">
            My Growth
            <br />
            Plan
            <br />
            Worksheet {checkLoc(local, "myPlan")}
          </a>
        </div>

        <div className="nav-item text-center mx-2">
          <a className="nav-link" href="./myMilestones">
            Milestone
            <br /> Details {checkLoc(local, "myMilestones")}
          </a>
        </div>
        <div className="nav-item text-center mx-2">
          <a className="nav-link" href="./myOverview">
            Milestone
            <br /> Overview
          </a>
        </div>
        <div className="nav-item text-center mx-2">
          <a className="nav-link" href="./table">
            Results <br />
            Table
          </a>
        </div>
        <div className="nav-item text-center mx-2">
          <a className="nav-link" href="./radar">
            Radar
          </a>
        </div>
        {/*         <div className="nav-item text-center mx-2">
          <a className="nav-link" href="./graph">
            Visualize {checkLoc(local, "graph")}
          </a>
        </div> */}
        <div className="nav-item text-center mx-2">
          <a className="nav-link" href="./edComp">
            Competencies {checkLoc(local, "edComp")}
          </a>
        </div>
        <div className="float-right">
          <ChooserDomain subElement="choosePlan" />
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
