import React, { Fragment } from "react";
import SubDetails from "./SubDetails";

var acc = 0;

const displayTarget = (category, progresses, inTarget) => {
  if (inTarget > 0) {
    acc = 0;
    var countComps = 0;
    // Get totals from child competencies
    category.category_has_competencies_of.forEach(competency => {
      const relevantProgress = progresses.filter(
        progress => progress.competency_progress[0].id === competency.id
      );
      countComps += 1;
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
        countComps += 1;
        if (relevantProgress.length > 0) {
          console.log(relevantProgress);
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
          countComps += 1;
          if (relevantProgress.length > 0) {
            acc =
              acc +
              relevantProgress[0].currentLevel *
                parseFloat(competency.default_weight);
          }
        });
      });
    });

    if (inTarget > 0) {
      if (acc >= inTarget) {
        const randnum = Math.floor(Math.random() * 14) + 1;
        const imagePath = "./images/badges/badge" + randnum.toString() + ".jpg";

        return (
          <Fragment>
            <img
              className="float-right mr-5 mt-2"
              width="100px"
              src={imagePath}
            />
            <br />
            <big>
              {acc} out of {inTarget} points,{" "}
              <span style={{ color: "#009900" }}>
                {Math.round((acc / inTarget) * 100)}% Completion
              </span>
            </big>
          </Fragment>
        );
      }

      return (
        <Fragment>
          <img
            className="float-right mr-5 mt-2"
            width="100px"
            src="./images/badges/badge0.png"
          />
          <big>
            {acc} out of {inTarget},{" "}
            <span style={{ color: "#cc9900" }}>
              {Math.round((acc / inTarget) * 100)}% Completion
            </span>
          </big>
        </Fragment>
      );
    } else {
      return (
        <big>
          {acc} Total Points from {countComps} Competencies
        </big>
      );
    }
  }
};

export default function Category(props) {
  // console.log(props);

  // Figure Out Target Value
  const thisComp = props.milestone.competencycategories.filter(
    competency => competency.id === props.category.id
  )[0];
  var thisTarget = -1;
  try {
    thisTarget = thisComp.TARGET_VALUE_IS_rel.filter(
      target => target.Milestone.ms === props.target && target.planId === "1"
    )[0].min;
    // TODO: Make PlanId a variable
  } catch (error) {}

  // TODO: Load Colors into form
  return (
    <Fragment>
      <div className="card border-success mb-3">
        <h4 className="ml-3">
          {props.category.label} -{" "}
          {displayTarget(
            props.category,
            props.user[0].has_progress_root[0].child_progress,
            thisTarget
          )}
          <br />
          <small className="text-muted"> {props.category.id} </small>{" "}
        </h4>

        <SubDetails
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
}
