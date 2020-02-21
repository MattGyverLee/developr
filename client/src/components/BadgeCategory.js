import React, { Fragment } from "react";
import BadgeCompetency from "./BadgeCompetency";
import BadgeGroup from "./BadgeGroup";

const processCatGroups = groupList => {
  try {
    groupList.map(group => <BadgeGroup key={group.id} group={group} />);
  } catch (error) {}
};
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
        console.log(relevantProgress);
        acc =
          acc +
          relevantProgress[0].currentLevel *
            parseFloat(competency.default_weight);
        // Todo: Handle non-default weight
        //todo: Figure out why Group 6 has none and 3 is wrong
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
            console.log(relevantProgress);
            acc =
              acc +
              relevantProgress[0].currentLevel *
                parseFloat(competency.default_weight);
          }
        });
      });
    });

    if (inTarget > 0) {
      return (
        <big>
          {acc} out of {inTarget}, {Math.round((acc / inTarget) * 100)}%
          Completion
        </big>
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

export default function BadgeCategory(props) {
  console.log(props);

  // Figure Out Target Value
  const thisComp = props.milestone.competencycategories.filter(
    competency => competency.id === props.category.id
  )[0];
  var thisTarget = -1;
  try {
    thisTarget = thisComp.TARGET_VALUE_IS_rel.filter(
      target => target.Milestone.ms === "LTCons1" && target.planId === "1"
    )[0].min;
    // TODO: Make PlanId a variable
    console.log(thisTarget);
  } catch (error) {}

  // TODO: Load Colors into form
  return (
    <Fragment>
      <div className="card border-success mb-3">
        <h4 className="ml-3">
          {props.category.label} -
          <small className="muted-text"> {props.category.id} </small>{" "}
          {displayTarget(
            props.category,
            props.user[0].has_progress_root[0].child_progress,
            thisTarget
          )}
        </h4>

        {props.category.category_has_competencies_of.map(competency => (
          <BadgeCompetency
            key={competency.id}
            competency={competency}
            user={props.user}
            milestone={props.milestone}
          />
        ))}
        {props.category.has_group.map(group => (
          <BadgeGroup
            key={group.id}
            group={group}
            user={props.user}
            milestone={props.milestone}
          />
        ))}
        {processCatGroups(props.category.has_group)}
      </div>
    </Fragment>
  );
}
