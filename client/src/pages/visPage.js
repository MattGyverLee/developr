import Plan from "./components/Plan";
import React, { Fragment } from "react";
import NavBar from "./components/NavBar";
import Graph from "./components/Graph";

var ReactDOM = require("react-dom");

function VisPage() {
  return (
    <Fragment>
      {NavBar("graph")}
      <div className="mx-3" maxWidth="100%" minWidth="98%">
        <h2> Vis.me</h2>
        <Graph planID="1" userId="1" />
      </div>
    </Fragment>
  );
}

export default VisPage;
