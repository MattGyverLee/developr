import React, { Fragment, useContext } from "react";
import ChooserCompetency from "../components/compEdit/ChooserCompetency";
import { SelectionContext } from "../components/utilities/SelectionContext";

function EditCompetency(props) {
  const { state } = useContext(SelectionContext);
  return (
    <Fragment>
      <div className="container">
        {parseInt(state.domainId) >= 0 && (
          <ChooserCompetency domainId={state.domainId} />
        )}
        {parseInt(state.domainId) === "-1" && (
          <div>Please choose a domain above to edit competencies.</div>
        )}
      </div>
    </Fragment>
  );
}

export default EditCompetency;
