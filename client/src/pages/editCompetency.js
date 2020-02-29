import React, { Fragment } from "react";
import NavBar from "./components/NavBar";
import ChooserDomain from "./components/ChooserDomain";

function EditCompetency() {
  return (
    <Fragment>
      {NavBar("editPlan")}
      <div className="mx-3">
        <ChooserDomain type="compEdit" child="chooseComp" />
      </div>
    </Fragment>
  );
}

export default EditCompetency;
