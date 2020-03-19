import React, { Fragment } from "react";
import { getScore2, getTarget } from "../utilities/maths";

export default function Competency(props) {
  // console.log(props);
  // TODO: Load Colors into form
  const target = getTarget(props.competency.id, props.milestone.minValues);

  const score = getScore2(props.competency, props.user);
  return (
    <Fragment>
      <div className="card border-warning mx-2 mb-1">
        <h4 className="ml-3 py-0">
          {props.competency.label} -
          <small className="text-muted"> {props.competency.id} </small>
          {target > score && (
            <span className="float-right mr-2" style={{ color: "#cc9900" }}>
              <big>{score}</big>/<small>{target}</small>
            </span>
          )}
          {score >= target && target > 0 && (
            <span className="float-right mr-2" style={{ color: "#009900" }}>
              <big>{score}</big>/<small>{target}</small>
            </span>
          )}
          {target <= 0 && (
            <span className="float-right mr-2" style={{ color: "#000000" }}>
              <big>{score}</big>
            </span>
          )}
        </h4>
      </div>
    </Fragment>
  );
}
