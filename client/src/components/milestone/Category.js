import React, { Fragment } from "react";
import SubDetails from "./SubDetails";
import { getTarget } from "../utilities/maths";

var acc = 0;

const displayProgress = (category, progresses, inTarget, minValues) => {
  // this runs when the Category has a target score.
  acc = 0;
  if (inTarget >= 0) {
    // Get totals from child competencies
    category.category_has_competencies_of.forEach(competency => {
      const relevantProgress = progresses.filter(
        progress => progress.competency_progress[0].id === competency.id
      );
      if (relevantProgress.length > 0) {
        acc =
          acc +
          relevantProgress[0].currentLevel *
            parseFloat(competency.default_weight);
        // Todo: Handle non-default weight
      }
    });
    // Get totals from child groups
    category.has_group.forEach(group => {
      group.group_has_competencies_of.forEach(competency => {
        const relevantProgress = progresses.filter(
          progress => progress.competency_progress[0].id === competency.id
        );
        if (relevantProgress.length > 0) {
          /* console.log(relevantProgress); */
          acc =
            acc +
            relevantProgress[0].currentLevel *
              parseFloat(competency.default_weight);
        }
      });
      group.has_group.forEach(group => {
        group.group_has_competencies_of.forEach(competency => {
          const relevantProgress = progresses.filter(
            progress => progress.competency_progress[0].id === competency.id
          );
          if (relevantProgress.length > 0) {
            acc =
              acc +
              relevantProgress[0].currentLevel *
                parseFloat(competency.default_weight);
          }
        });
      });
    });
    if (acc === 0 && inTarget === 0) {
      return null;
    }
    if (acc >= inTarget) {
      // Gets Badge
      const randnum = Math.floor(Math.random() * 14) + 1;
      const imagePath = "./images/badges/badge" + randnum.toString() + ".jpg";

      return (
        <Fragment>
          <div className="float-right mr-2 mt-2">
            <span style={{ color: "#009900" }}>
              <big>{acc}</big>/<small>{inTarget}</small> points,{" "}
              {Math.round((acc / inTarget) * 100)}% Completion -{" "}
            </span>
            <img width="100px" alt="Badge" src={imagePath} />
          </div>
          <br />
        </Fragment>
      );
    } else {
      return (
        <Fragment>
          <div className="float-right mr-2 mt-2">
            <span style={{ color: "#cc9900" }}>
              <big>{acc}</big>/<small>{inTarget}</small> points,{" "}
              {Math.round((acc / inTarget) * 100)}% Completion -{" "}
            </span>
            <img width="100px" alt="Badge" src="./images/badges/badge0.png" />
          </div>
        </Fragment>
      );
    }
  }
  var totalTarget = 0;
  if (inTarget <= 0) {
    // targets are unavalable or further down
    var badge = true;
    totalTarget = 0;
    // Get totals from child competencies and check progress
    category.category_has_competencies_of.forEach(competency => {
      const relevantProgress = progresses.filter(
        progress => progress.competency_progress[0].id === competency.id
      );
      if (relevantProgress.length > 0) {
        const target = getTarget(competency.id, minValues);
        if (
          relevantProgress[0].currentLevel *
            parseFloat(competency.default_weight) <
          target
        ) {
          badge = false;
          acc =
            acc +
            relevantProgress[0].currentLevel *
              parseFloat(competency.default_weight);
        }
        totalTarget = totalTarget + target;
        // Todo: Handle non-default weight
      }
    });

    // Get totals from child groups
    category.has_group.forEach(group => {
      group.group_has_competencies_of.forEach(competency => {
        const relevantProgress = progresses.filter(
          progress => progress.competency_progress[0].id === competency.id
        );
        if (relevantProgress.length > 0) {
          const target = getTarget(competency.id, minValues);
          if (
            relevantProgress[0].currentLevel *
              parseFloat(competency.default_weight) <
            target
          ) {
            badge = false;
            acc =
              acc +
              relevantProgress[0].currentLevel *
                parseFloat(competency.default_weight);
          }
          totalTarget = totalTarget + target;
          // Todo: Handle non-default weight
        }
      });
      group.has_group.forEach(group => {
        group.group_has_competencies_of.forEach(competency => {
          const relevantProgress = progresses.filter(
            progress => progress.competency_progress[0].id === competency.id
          );
          if (relevantProgress.length > 0) {
            const target = getTarget(competency.id, minValues);
            if (
              relevantProgress[0].currentLevel *
                parseFloat(competency.default_weight) <
              target
            ) {
              badge = false;
              acc =
                acc +
                relevantProgress[0].currentLevel *
                  parseFloat(competency.default_weight);
            }
            totalTarget = totalTarget + target;
            // Todo: Handle non-default weight
          }
        });
      });
    });
    if (totalTarget === 0 && acc === 0) {
      return null;
    }
    if (badge) {
      // Gets Badge
      const randnum = Math.floor(Math.random() * 14) + 1;
      const imagePath = "./images/badges/badge" + randnum.toString() + ".jpg";

      return (
        <Fragment>
          <div className="float-right mr-2 mt-2">
            <span style={{ color: "#009900" }}>Category Complete - </span>
            <img width="100px" alt="Badge" src={imagePath} />
          </div>
          <br />
        </Fragment>
      );
    }
    if (inTarget < 0 && !badge) {
      return (
        <Fragment>
          <div className="float-right mr-2 mt-2">
            <span style={{ color: "#cc9900" }}>Category Incomplete - </span>
            <img width="100px" alt="Badge" src="./images/badges/badge0.png" />
          </div>
          <br />
        </Fragment>
      );
    }
  }
};

export default function Category(props) {
  // Figure Out Target Value
  const thisComp = props.milestone.competencycategories.filter(
    competency => competency.id === props.category.id
  )[0];
  var thisTarget = -1;
  var mode = "cat";

  if (thisComp && thisComp.TARGET_VALUE_IS_rel.length > 0) {
    thisTarget = thisComp.TARGET_VALUE_IS_rel.filter(
      target =>
        target.Milestone.ms === props.target && target.planId === props.planId
    )[0].min;
  } else {
    mode = "grp";
  }
  if (
    displayProgress(
      props.category,
      props.user[0].has_progress_root[0].child_progress,
      thisTarget,
      props.milestone.minValues
    ) !== null
  ) {
    // TODO: Load Colors into form
    return (
      <Fragment>
        <div className="card border-success ml-3 mb-3">
          <h2 className="ml-3">
            {props.category.label}
            {displayProgress(
              props.category,
              props.user[0].has_progress_root[0].child_progress,
              thisTarget,
              props.milestone.minValues
            )}
            <small className="text-muted"> {props.category.id} </small>
          </h2>

          <SubDetails
            mode={mode}
            display={true}
            category={props.category}
            user={props.user}
            milestone={props.milestone}
            planId={props.planId}
            target={props.target}
            details={props.details}
          />
        </div>
      </Fragment>
    );
  } else return null;
}
