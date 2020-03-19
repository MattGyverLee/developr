import React, { Fragment } from "react";
import Competency from "./Competency";
import { findSortOrder } from "../utilities/sort";

export default function Group(props) {
  console.log(props);
  // TODO: Load Colors into form
  return (
    <Fragment>
      <div className="card border-info mb-0 mx-3">
        <h4 className="ml-3">
          {props.group.label} -
          <small className="text-muted"> {props.group.id}</small>
        </h4>
        {findSortOrder(props.group.group_has_competencies_of).map(
          competency => (
            <Competency
              key={competency.id}
              competency={competency}
              user={props.user}
              milestone={props.milestone}
              target={props.target}
              details={props.details}
              planId={props.planId}
            />
          )
        )}
      </div>
    </Fragment>
  );
}
