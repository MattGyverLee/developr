import Plan from "./components/Plan";
import React, { Fragment } from "react";
import NavBar from "./components/NavBar";
import ChooserDomain from "./components/ChooserDomain";

function EditCompetency() {
  return (
    <Fragment>
      {NavBar("editPlan")}
      <div className="mx-3">
        <ChooserDomain />
      </div>
    </Fragment>
  );
}

export default EditCompetency;
