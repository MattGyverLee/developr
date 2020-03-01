import React, { Fragment } from "react";

const displayScore = (competency, progresses) => {
  if (progresses && progresses.length > 0) {
    const relevantProgress = progresses[0].has_progress_root[0].child_progress.filter(
      progress => progress.competency_progress[0].id === competency.id
    );
    if (relevantProgress.length > 0) {
      /*       console.log(relevantProgress); */
      return (
        <big>
          {relevantProgress[0].currentLevel *
            parseFloat(competency.default_weight)}
        </big>
      );
      // Todo: Handle non-default weight
    }
  }
};

export default function BadgeCompetency(props) {
  // console.log(props);
  // TODO: Load Colors into form
  return (
    <Fragment>
      <div className="card border-warning mb-3">
        <h4 className="ml-3 py-0">
          {props.competency.label} -
          <small className="text-muted"> {props.competency.id} </small>
          {displayScore(props.competency, props.user)}
        </h4>
      </div>
    </Fragment>
  );
}
