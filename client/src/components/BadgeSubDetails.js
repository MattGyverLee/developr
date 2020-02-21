import React, { Fragment } from "react";
import BadgeCompetency from "./BadgeCompetency";
import BadgeGroup from "./BadgeGroup";

const processCatGroups = groupList => {
  try {
    groupList.map(group => <BadgeGroup key={group.id} group={group} />);
  } catch (error) {}
};

// Todo: why is BadgeGroup done twice?

export default function BadgeSubDetails(props) {
  //console.log(props.category);
  // TODO: Load Colors into form
  if (props.details) {
    return (
      <Fragment>
        {props.category.category_has_competencies_of.map(competency => (
          <BadgeCompetency
            key={competency.id}
            competency={competency}
            user={props.user}
            milestone={props.milestone}
            target={props.target}
            planId={props.planId}
          />
        ))}
        {props.category.has_group.map(group => (
          <BadgeGroup
            key={group.id}
            group={group}
            user={props.user}
            milestone={props.milestone}
            target={props.target}
            planId={props.planId}
          />
        ))}
        {processCatGroups(props.category.has_group)}
      </Fragment>
    );
  } else {
    return null;
  }
}
