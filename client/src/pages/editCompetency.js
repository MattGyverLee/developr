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
        {state.domainId === "-1" && (
          <div id="makeChoices">
            Please choose a domain above to view competency details.
          </div>
        )}
      </div>
    </Fragment>
  );
}

export default EditCompetency;
