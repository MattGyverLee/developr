import React, { Fragment } from "react";
import DetailsForm from "./DetailsForm";
import { findSortOrder } from "../utilities/sort";
import { getColor, calcAlpha } from "../utilities/color";

export default function GroupDetails(props) {
  const color = getColor(props.color, calcAlpha(props.depth));
  const showCompDetailsForm = input => {
    if (input && input.length > 0) {
      return findSortOrder(input).map(competency => (
        <DetailsForm
          key={competency.id}
          competency={competency}
          color={props.color}
          depth={props.depth + 1}
        />
      ));
    }
  };

  const showGroupDetails = input => {
    if (input && input.length > 0) {
      return findSortOrder(input).map(group => (
        <GroupDetails
          key={group.id}
          group={group}
          color={props.color}
          depth={props.depth + 1}
        />
      ));
    }
  };

  /* {showCompDetails(props.group.group_has_competencies_of)} */
  return (
    <Fragment>
      <div className="card border-warning py-1 mb-1 mx-2">
        <h4 style={{ backgroundColor: color }} className="card-header mb-2">
          {props.group.label}
        </h4>

        {showCompDetailsForm(props.group.group_has_competencies_of)}
        {showGroupDetails(props.group.has_group)}
      </div>
    </Fragment>
  );
}
