import React, { Fragment } from "react";
import Competency from "./Competency";
import Group from "./Group";
import { findSortOrder } from "../utilities/sort";

const processCatGroups = groupList => {
  try {
    groupList.map(group => <Group key={group.id} group={group} />);
  } catch (error) {}
};

// Todo: why is BadgeGroup done twice?

export default function SubDetails(props) {
  // TODO: Load Colors into form
  if (props.details) {
    return (
      <Fragment>
        {findSortOrder(props.category.category_has_competencies_of).map(
          competency => (
            <Competency
              key={competency.id}
              competency={competency}
              user={props.user}
              milestone={props.milestone}
              target={props.target}
              planId={props.planId}
              color={props.color}
              depth={props.depth}
            />
          )
        )}
        {findSortOrder(props.category.has_group).map(group => (
          <Group
            key={group.id}
            group={group}
            user={props.user}
            milestone={props.milestone}
            target={props.target}
            planId={props.planId}
            color={props.color}
            depth={props.depth}
          />
        ))}
        {processCatGroups(props.category.has_group)}
      </Fragment>
    );
  } else {
    return null;
  }
}
