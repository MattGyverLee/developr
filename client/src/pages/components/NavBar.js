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
      <a className="navbar-brand text-center">
        <span className="navbar-brand logo my-n1">level.up</span>
        <br />
        <div className="mb-n1 mt-n2">Growth Tracking</div>
      </a>
      <button
        className="navbar-toggler"
        type="button"
        data-toggle="collapse"
        data-target="#navbarColor01"
        aria-controls="navbarColor01"
        aria-expanded="false"
        aria-label="Toggle navigation">
        <span className="navbar-toggler-icon"></span>
      </button>

      <div className="collapse navbar-collapse" id="navbarColor01">
        <ul className="navbar-nav mr-auto">
          <li className="nav-item active">
            <a className="nav-link" href="./">
              Home {checkLoc(local, "home")}
            </a>
          </li>
          <li className="nav-item">
            <a className="nav-link" href="./myPlan">
              My Growth Plan {checkLoc(local, "myPlan")}
            </a>
          </li>
          <li className="nav-item">
            <a className="nav-link" href="./myMilestones">
              My Milestones {checkLoc(local, "myMilestones")}
            </a>
          </li>
          <li className="nav-item">
            <a className="nav-link" href="./graph">
              Visualize Plan {checkLoc(local, "graph")}
            </a>
          </li>
          <li className="nav-item">
            <a className="nav-link" href="./edComp">
              Competencies {checkLoc(local, "edComp")}
            </a>
          </li>
        </ul>
        <div className="float-right">
          <ChooserDomain subElement="choosePlan" />
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
