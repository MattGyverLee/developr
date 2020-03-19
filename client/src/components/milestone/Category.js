import React, { Fragment } from "react";
import SubDetails from "./SubDetails";
import { getTarget } from "../utilities/maths";

var acc = 0;

const displayProgress = (category, progresses, inTarget, minValues) => {
  // this runs when the Category has a target score.
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

    if (acc >= inTarget) {
      // Gets Badge
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
          <br />
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
  }
  if (inTarget <= 0) {
    // targets are unavalable or further down
    var badge = true;
    // Get totals from child competencies and check progress
    category.category_has_competencies_of.forEach(competency => {
      console.log(competency.id);
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
        }
        console.log(badge);
        // Todo: Handle non-default weight
      }
    });

    // Get totals from child groups
    category.has_group.forEach(group => {
      console.log(group.id);
      console.log("Point 1");
      group.group_has_competencies_of.forEach(competency => {
        console.log(competency.id);
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
          }
          console.log("Point 2");
          console.log(badge);
          // Todo: Handle non-default weight
        }
      });
      group.has_group.forEach(group => {
        console.log(group.id);
        console.log("Point 3");
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
            }
            console.log("Point 4");
            console.log(badge);
            // Todo: Handle non-default weight
          }
        });
      });
    });
    if (badge) {
      return <big>Badge</big>;
    } else {
      return <big>NoBadge</big>;
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
  var mode = "cat";
  try {
    thisTarget = thisComp.TARGET_VALUE_IS_rel.filter(
      target => target.Milestone.ms === props.target && target.planId === "1"
    )[0].min;
    console.log(thisTarget);
    // TODO: Make PlanId a variable
  } catch (error) {
    console.log(error);
    mode = "grp";
  }

  // TODO: Load Colors into form
  return (
    <Fragment>
      <div className="card border-success ml-3 mb-3">
        <h4 className="ml-3">
          {props.category.label} -{" "}
          {displayProgress(
            props.category,
            props.user[0].has_progress_root[0].child_progress,
            thisTarget,
            props.milestone.minValues
          )}
          <small className="text-muted"> {props.category.id} </small>
        </h4>

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
}
