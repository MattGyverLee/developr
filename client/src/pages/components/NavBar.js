import React from "react";

const checkLoc = (local, ref) => {
  // console.log(local, ref);
  if (local == ref) {
    return <span class="sr-only">(current)</span>;
  }
};
const NavBar = local => {
  return (
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
      <a class="navbar-brand" href="#">
        Developer
      </a>
      <button
        class="navbar-toggler"
        type="button"
        data-toggle="collapse"
        data-target="#navbarColor01"
        aria-controls="navbarColor01"
        aria-expanded="false"
        aria-label="Toggle navigation">
        <span class="navbar-toggler-icon"></span>
      </button>

      <div class="collapse navbar-collapse" id="navbarColor01">
        <ul class="navbar-nav mr-auto">
          <li class="nav-item active">
            <a class="nav-link" href="/">
              Home {checkLoc(local, "home")}
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link" href="/myPlan">
              My Growth Plan {checkLoc(local, "myPlan")}
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link" href="/myMilestones">
              My Milestones {checkLoc(local, "myMilestones")}
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link" href="/graph">
              Visualize Plan {checkLoc(local, "graph")}
            </a>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default NavBar;
