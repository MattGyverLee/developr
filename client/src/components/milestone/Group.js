import React, { Fragment } from "react";
import Competency from "./Competency";
import { findSortOrder } from "../utilities/sort";
import { getColor, calcAlpha } from "../utilities/color";

export default function Group(props) {
  // TODO: Load Colors into form

  const color = getColor(props.color, calcAlpha(props.depth));
  return (
    <Fragment>
      <div className="card border-info mb-1 mx-2">
        <h3 style={{ backgroundColor: color }} className="card-header ml-2">
          {props.group.label}
          {/* - <small className="text-muted"> {props.group.id}</small> */}
        </h3>
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
              color={props.color}
              depth={props.depth + 1}
            />
          )
        )}
      </div>
    </Fragment>
  );
}
