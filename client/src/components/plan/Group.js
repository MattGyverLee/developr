import React, { Fragment } from "react";
import DetailsForm from "./DetailsForm";
import GroupDetail from "./Group";
import { findSortOrder } from "../utilities/sort";

export default function GroupDetails(props) {
  const showCompDetailsForm = input => {
    if (input && input.length > 0) {
      return findSortOrder(input).map(competency => (
        <DetailsForm key={competency.id} competency={competency} />
      ));
    }
  };

  const showGroupDetails = input => {
    if (input && input.length > 0) {
      return findSortOrder(input).map(group => (
        <GroupDetail key={group.id} group={group} />
      ));
    }
  };
  /* {showCompDetails(props.group.group_has_competencies_of)} */
  return (
    <Fragment>
      <div className="card border-warning mb-1 mx-2">
        <h4 className="card-header mb-2">{props.group.label}</h4>

        {showCompDetailsForm(props.group.group_has_competencies_of)}
        {showGroupDetails(props.group.has_group)}
      </div>
    </Fragment>
  );
}
