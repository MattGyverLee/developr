import React, { Fragment, useContext } from "react";
import ChooserCompetency from "./components/ChooserCompetency";
import { useQuery } from "@apollo/react-hooks";
import { SITREP } from "./queries";

function EditCompetency(props) {
  const { domainId } = useQuery(SITREP);
  return (
    <Fragment>
      <div className="container">
        {parseInt(domainId) >= 0 && <ChooserCompetency domainId={domainId} />}
        {parseInt(domainId) === "-1" && (
          <div>Please choose a domain above to edit competencies.</div>
        )}
      </div>
    </Fragment>
  );
}

export default EditCompetency;
