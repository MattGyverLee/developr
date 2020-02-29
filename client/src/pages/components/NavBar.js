import React from "react";

const checkLoc = (local, ref) => {
  // console.log(local, ref);
  if (local === ref) {
    return <span className="sr-only">(current)</span>;
  }
};
const NavBar = local => {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
      <a className="navbar-brand" href="#">
        Developer
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
      </div>
    </nav>
  );
};

export default NavBar;
