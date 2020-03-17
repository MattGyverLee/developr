import React, { Fragment } from "react";

const displayScore = (competency, progresses) => {
  if (progresses && progresses.length > 0) {
    const relevantProgress = progresses[0].has_progress_root[0].child_progress.filter(
      progress => progress.competency_progress[0].id === competency.id
    );
    if (relevantProgress.length > 0) {
      /*       console.log(relevantProgress); */
      return (
        relevantProgress[0].currentLevel * parseFloat(competency.default_weight)
      );
      // Todo: Handle non-default weight
    }
  }
};

const getTarget = (targetId, list) => {
  console.log(list);
  const thing = list.filter(target => target.id === targetId);
  return thing[0].min;
};

export default function Competency(props) {
  // console.log(props);
  // TODO: Load Colors into form
  const target = getTarget(props.competency.id, props.milestone.minValues);
  const score = displayScore(props.competency, props.user);
  return (
    <Fragment>
      <div className="card border-warning ml-3 mb-3">
        <h4 className="ml-3 py-0">
          {props.competency.label} -
          <small className="text-muted"> {props.competency.id} </small>
          {target > score && (
            <span style={{ color: "#cc9900" }}>
              {score}/{target}
            </span>
          )}
          {score >= target && (
            <span style={{ color: "#009900" }}>
              {score}/{target}
            </span>
          )}
        </h4>
      </div>
    </Fragment>
  );
}
