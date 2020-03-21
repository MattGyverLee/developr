import React, { Fragment } from "react";

function Home() {
  return (
    <Fragment>
      <h2>Home</h2>
      <div>{process.env.REACT_APP_NEO4J_URI}</div>
    </Fragment>
  );
}

export default Home;
