import React, { Fragment } from "react";
import NavBar from "./NavBar";

function Home() {
  return (
    <Fragment>
      {NavBar("home")}
      <h2>Home</h2>
    </Fragment>
  );
}

export default Home;
